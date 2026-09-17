export function publicUrl(filePath: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const path = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${base}${path}`;
}
