// 간단한 cn 함수 - clsx, tailwind-merge 없이
export function cn(
  ...classes: (string | undefined | null | boolean)[]
): string {
  return classes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("ko-KR");
};

export const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + "..." : text;
};
