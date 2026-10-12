// Cloudflare 정적 배포 앞단의 아주 작은 Worker.
//
// Next.js 정적 내보내기는 동적 경로([...slug], [id])의 화면 이동용 파일 이름에 "$"를 쓴다.
// 예: /docs/a/b/__next.docs.$c$slug.__PAGE__.txt
// Cloudflare 정적 자산은 "$"가 든 경로를 "%24"로 리다이렉트하므로, 미리 불러오기마다 왕복이 한 번씩 늘고
// 일부 환경에서는 리다이렉트가 반복된다. 여기서 경로를 미리 "%24"로 바꿔 자산을 바로 돌려준다.
// wrangler.jsonc의 run_worker_first에 적힌 경로만 이 Worker를 거친다.
const worker = {
  /** @param {Request} request @param {{ ASSETS: { fetch: typeof fetch } }} env */
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.includes("$")) {
      url.pathname = url.pathname.replaceAll("$", "%24");
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
