import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <Link href="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        문서 목록으로
      </Link>
    </div>
  );
}
