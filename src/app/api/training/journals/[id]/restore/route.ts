import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
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

    // Check if journal exists and is deleted
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

    // Check if journal is actually deleted
    if (!existingJournal.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'Journal is not deleted' },
        { status: 400 }
      );
    }

    // Check permissions - user owns journal or is admin/coach
    const canRestore =
      existingJournal.student_id === userProfile.id ||
      ['admin', 'coach'].includes(userProfile.role);

    if (!canRestore) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Restore the journal (soft delete reversal)
    const { data: restoredJournal, error: restoreError } = await supabase
      .from('journals')
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (restoreError) {
      console.error('Error restoring journal:', restoreError);
      return NextResponse.json(
        { success: false, error: 'Failed to restore journal' },
        { status: 500 }
      );
    }

    // Create audit log entry
    try {
      await supabase.from('audit_logs').insert({
        user_id: userProfile.id,
        action: 'journal_restore',
        resource_type: 'journal',
        resource_id: id,
        details: {
          journal_title: existingJournal.title,
          journal_type: existingJournal.journal_type,
          category_name: existingJournal.category?.name,
          task_completions_count: existingJournal.task_completions?.length || 0,
          photos_count: existingJournal.journal_photos?.length || 0,
          was_public: existingJournal.is_public,
          restored_at: new Date().toISOString(),
          originally_deleted_at: existingJournal.deleted_at,
          originally_deleted_by: existingJournal.deleted_by,
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the restoration if audit logging fails
    }

    // Fetch the fully restored journal with all related data
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
      console.error('Error fetching restored journal:', fetchFullError);
      return NextResponse.json({
        success: true,
        data: restoredJournal,
        message: 'Journal restored successfully',
      });
    }

    return NextResponse.json({
      success: true,
      data: fullJournal,
      message: 'Journal restored successfully',
    });
  } catch (error) {
    console.error('Error in journal restore API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
