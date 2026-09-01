/**
 * Script chạy TRƯỚC lần paint đầu tiên, nhúng thẳng vào `<head>` của cả hai
 * app. Không có nó thì trang luôn vẽ ở màu sáng rồi mới nhảy sang tối khi React
 * hydrate xong — nháy trắng mỗi lần tải.
 *
 * Cố ý là một **chuỗi**, không phải hàm rồi `.toString()`: minifier được phép
 * đổi tên biến và inline hàm, và một hàm bị đổi tên khi stringify sẽ chạy sai
 * hoặc không chạy.
 *
 * Vì vậy `noalhub-theme` ở đây là hằng số cứng, không import `THEME_STORAGE_KEY`
 * được — bundler không thay được biến vào trong chuỗi. Đổi key thì phải đổi
 * cả hai chỗ; `types.ts` có chú thích nhắc lại.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("noalhub-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;
