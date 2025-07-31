import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch journal with all related data
    const { data: journal, error } = await supabase
      .from('journals')
      .select(
        `
        *,
        category:categories(*),
        student:user_profiles!journals_student_id_fkey(*),
        task_completions(
          *,
          task_template:task_templates(*)
        ),
        journal_photos(*),
        comments(
          *,
          author:user_profiles!comments_author_id_fkey(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching journal:', error);
      return NextResponse.json(
        { success: false, error: 'Journal not found' },
        { status: 404 }
      );
    }

    if (!journal) {
      return NextResponse.json(
        { success: false, error: 'Journal not found' },
        { status: 404 }
      );
    }

    // Check authorization - user can only view their own journals or public journals
    const userProfile = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (userProfile.error || !userProfile.data) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const canView =
      journal.student_id === userProfile.data.id || journal.is_public;

    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: journal,
    });
  } catch (error) {
    console.error('Error in journal detail API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if journal exists and user owns it
    const { data: existingJournal, error: fetchError } = await supabase
      .from('journals')
      .select('student_id, journal_type')
      .eq('id', id)
      .single();

    if (fetchError || !existingJournal) {
      return NextResponse.json(
        { success: false, error: 'Journal not found' },
        { status: 404 }
      );
    }

    if (existingJournal.student_id !== userProfile.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Start transaction
    const { data: updatedJournal, error: updateError } = await supabase
      .from('journals')
      .update({
        title: body.title,
        content: body.content,
        is_public: body.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating journal:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update journal' },
        { status: 500 }
      );
    }

    // Handle journal-type specific updates
    if (
      existingJournal.journal_type === 'structured' &&
      body.task_completions
    ) {
      // Update task completions
      for (const completion of body.task_completions) {
        if (completion.id) {
          // Update existing completion
          const { error: completionError } = await supabase
            .from('task_completions')
            .update({
              is_completed: completion.is_completed,
              completion_note: completion.completion_note,
              completed_at: completion.is_completed
                ? new Date().toISOString()
                : null,
            })
            .eq('id', completion.id);

          if (completionError) {
            console.error('Error updating task completion:', completionError);
          }
        }
      }
    } else if (existingJournal.journal_type === 'photo') {
      // Handle photo updates
      if (body.photos_to_delete && body.photos_to_delete.length > 0) {
        // Delete photos
        const { error: deleteError } = await supabase
          .from('journal_photos')
          .delete()
          .in('id', body.photos_to_delete);

        if (deleteError) {
          console.error('Error deleting photos:', deleteError);
        }
      }

      if (body.photos_to_update && body.photos_to_update.length > 0) {
        // Update photo captions
        for (const photo of body.photos_to_update) {
          const { error: updatePhotoError } = await supabase
            .from('journal_photos')
            .update({ caption: photo.caption })
            .eq('id', photo.id);

          if (updatePhotoError) {
            console.error('Error updating photo caption:', updatePhotoError);
          }
        }
      }

      if (body.new_photos && body.new_photos.length > 0) {
        // Handle new photo uploads
        for (let i = 0; i < body.new_photos.length; i++) {
          const photo = body.new_photos[i];

          // Upload photo to storage
          const fileName = `${id}_${Date.now()}_${i}.jpg`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('journal-photos')
              .upload(fileName, photo.file);

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('journal-photos')
            .getPublicUrl(fileName);

          // Save photo record
          const { error: photoError } = await supabase
            .from('journal_photos')
            .insert({
              journal_id: id,
              photo_url: urlData.publicUrl,
              caption: photo.caption || null,
              order_index: i,
              file_size: photo.file.size,
              file_type: photo.file.type,
            });

          if (photoError) {
            console.error('Error saving photo record:', photoError);
          }
        }
      }
    }

    // Fetch updated journal with all related data
    const { data: fullJournal, error: fetchFullError } = await supabase
      .from('journals')
      .select(
        `
        *,
        category:categories(*),
        student:user_profiles!journals_student_id_fkey(*),
        task_completions(
          *,
          task_template:task_templates(*)
        ),
        journal_photos(*),
        comments(
          *,
          author:user_profiles!comments_author_id_fkey(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (fetchFullError) {
      console.error('Error fetching updated journal:', fetchFullError);
      return NextResponse.json({
        success: true,
        data: updatedJournal,
      });
    }

    return NextResponse.json({
      success: true,
      data: fullJournal,
    });
  } catch (error) {
    console.error('Error in journal update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if permanent deletion is requested from request body
    let permanent = false;
    try {
      const body = await request.json();
      permanent = body.permanent === true;
    } catch {
      // If no body or invalid JSON, check URL params as fallback
      const url = new URL(request.url);
      permanent = url.searchParams.get('permanent') === 'true';
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if journal exists and get full details for audit
    const { data: existingJournal, error: fetchError } = await supabase
      .from('journals')
      .select(
        `
        *,
        category:categories(name),
        task_completions(*),
        journal_photos(*)
      `
      )
      .eq('id', id)
      .single();

    if (fetchError || !existingJournal) {
      return NextResponse.json(
        { success: false, error: 'Journal not found' },
        { status: 404 }
      );
    }

    // Check permissions - user owns journal or is admin/coach
    const canDelete =
      existingJournal.student_id === userProfile.id ||
      ['admin', 'coach'].includes(userProfile.role);

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if journal is already soft deleted
    if (existingJournal.deleted_at && !permanent) {
      return NextResponse.json(
        { success: false, error: 'Journal is already deleted' },
        { status: 400 }
      );
    }

    let result;

    if (permanent || existingJournal.deleted_at) {
      // Permanent deletion

      // Delete associated photos from storage
      if (
        existingJournal.journal_photos &&
        existingJournal.journal_photos.length > 0
      ) {
        for (const photo of existingJournal.journal_photos) {
          try {
            const fileName = photo.photo_url.split('/').pop();
            if (fileName) {
              await supabase.storage.from('journal-photos').remove([fileName]);
            }
          } catch (storageError) {
            console.error('Error deleting photo from storage:', storageError);
          }
        }
      }

      // Hard delete journal (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('journals')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error permanently deleting journal:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to permanently delete journal' },
          { status: 500 }
        );
      }

      result = { type: 'permanent', message: 'Journal permanently deleted' };
    } else {
      // Soft delete
      const { data: softDeletedJournal, error: softDeleteError } =
        await supabase
          .from('journals')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: userProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

      if (softDeleteError) {
        console.error('Error soft deleting journal:', softDeleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete journal' },
          { status: 500 }
        );
      }

      result = {
        type: 'soft',
        message: 'Journal moved to trash',
        data: softDeletedJournal,
      };
    }

    // Create audit log entry
    try {
      await supabase.from('audit_logs').insert({
        user_id: userProfile.id,
        action: permanent ? 'journal_permanent_delete' : 'journal_soft_delete',
        resource_type: 'journal',
        resource_id: id,
        details: {
          journal_title: existingJournal.title,
          journal_type: existingJournal.journal_type,
          category_name: existingJournal.category?.name,
          task_completions_count: existingJournal.task_completions?.length || 0,
          photos_count: existingJournal.journal_photos?.length || 0,
          was_public: existingJournal.is_public,
          deletion_type: permanent ? 'permanent' : 'soft',
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the deletion if audit logging fails
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in journal delete API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
