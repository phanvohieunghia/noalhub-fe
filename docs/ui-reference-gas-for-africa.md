# Tham chiếu UI: Gas for Africa (Roselab)

Nguồn: shot Dribbble "Gas for Africa – About Us" (Salvador Fernández / Roselab) và 4 video
chuyển động đi kèm. Khung hình đã trích sẵn trong `docs/reference/gas-for-africa/` (mỗi ảnh là
một contact sheet, đọc trái→phải, trên→dưới theo thời gian).

Mục tiêu: lấy **ngôn ngữ thiết kế** (không lấy nội dung, ảnh hay thương hiệu của họ) để dựng
bề mặt công khai của Noalhub. **Màu giữ xanh dương, làm bản sáng (light) trước**; dark làm sau.

## 1. Bốn video nói gì

| File | Nội dung | Ý chính |
|---|---|---|
| `01-blog-list-to-article` | Trang Blog → bấm thẻ → trang bài viết | Panel sáng bo lớn nổi trên nền navy. Cột trái: tiêu đề + mô tả + danh mục có số đếm. Phải: ô lọc dạng pill, lưới 2 cột thẻ bài (ảnh, tiêu đề, trích đoạn, tag, ngày). Thẻ đầu là bài nổi bật to hơn. Bấm thẻ thì panel đổi sang bài: tag, tiêu đề lớn bên trái, mô tả bên phải, dòng tác giả + ngày, ảnh hero rộng có **hai góc dưới bo rất lớn** |
| `02-about-sketch-reveal` | Mục "Building a Brighter Future…" | Tranh phác skyline **được vẽ lộ dần từ trái sang phải**, rồi ba thẻ nổi lên lần lượt (stagger). Thẻ 1 ✕ thực trạng, thẻ 2 ✓ giải pháp, thẻ 3 câu chốt chữ lớn nền tint có hoạ tiết |
| `03-about-hero` | Hero trang About | Bố cục 2 cột: trái là hai ô xếp dọc (ô xanh có pill "Our mission" + câu sứ mệnh; ô ảnh aerial duotone), phải là panel sáng cao với nav, heading nửa phải, tranh phác nhà máy cao ở nửa trái dưới, mạng lưới nút mờ làm nền |
| `04-blog-cards-scroll` | Cuộn danh sách thẻ bài cạnh bài chi tiết | Hai cột thẻ **lệch hàng** (masonry thô) trên nền ảnh duotone xanh, cuộn có parallax nhẹ. Bên phải là bài chi tiết dạng panel, ảnh dưới bo vòm |

## 2. Nhận định style

- **Một họ màu duy nhất.** Xanh chàm từ đậm (`#080D2A`, `#131F5F`) đến nhạt (`#B3B4CC`), chữ và tranh đều cùng họ này. Không có màu nhấn thứ hai.
- **Panel sáng trên nền xanh.** Panel bo ~24px tách khỏi nền bằng *đổi tông*, nội dung nằm gọn trong panel. Ngoài panel chỉ còn nền xanh và ảnh.
- **Ảnh duotone.** Mọi ảnh thật (công trường, aerial, chân dung) bị đưa về một sắc xanh, nên ảnh khác nguồn vẫn đồng bộ. Đây là thứ giữ cả hệ thống nhìn liền khối.
- **Tranh phác một màu** (nét bút bi xanh, mép tan) làm hình điểm nhấn, tràn sát mép panel. Có chất biên tập, ấm hơn ảnh vector.
- **Chữ:** sans hình học, heading đậm, tracking âm, 2–3 dòng; body nhỏ, màu xanh đậm (không xám). Căn giữa chỉ ở heading mục nhấn, còn lại căn trái.
- **Thẻ:** bo 12–16px, nền tint, chip tag outline, ngày nhỏ cạnh chip. Bố cục lệch hàng cho cảm giác biên tập, không cứng như lưới đều.
- **Chuyển động:** tranh vẽ lộ dần, thẻ stagger nổi lên, panel chuyển trạng thái (list → bài) liền mạch, parallax nhẹ ở nền. Không có chuyển động trang trí vô nghĩa.

## 3. Quyết định áp vào Noalhub

| Điểm của tham chiếu | Quyết định | Lý do |
|---|---|---|
| Palette xanh chàm tối của shot (`#182D90`…) | **Không lấy màu**: giữ xanh (hue ~214°, gần teal cũ) và sáng bằng thang teal cũ (`docs/theme.md` §5.1) | Yêu cầu của Noah: tông sáng ngang màu hiện tại |
| Nền kem `#EAD8C8` | Đổi sang xanh rất nhạt (neutral hue ~230°, chroma thấp) | Yêu cầu giữ xanh, và `design-taste-frontend` cấm cặp kem + đất nung |
| Viền 1px quanh thẻ, chip, ô lọc | Tách bằng **bậc tông nền**; chip dùng nền tint đặc | House rules cấm viền mảnh/ô outline. Nếu muốn giữ viền cho giống shot thì nói lại để mở ngoại lệ |
| Gradient ở ô "Our mission" và thẻ chốt | Màu phẳng `brand` đậm / tint, hoạ tiết lục giác để dạng hình phẳng một sắc | Cấm gradient |
| Nền ảnh thành phố phủ xanh | Nền `brand` phẳng, ảnh duotone chỉ đặt trong panel | Nhẹ hơn, và không cần ảnh nền riêng |
| Ảnh/tranh phác về khí đốt, châu Phi | Thay bằng hình của Noalhub (phòng đọc, bàn học, trò chuyện); tranh phác SVG/ảnh vẽ riêng hoặc tìm kho mở có ghi credit | Không dùng tài sản của bên khác |
| Số đếm nhỏ trên danh mục (superscript) | Giữ, dùng tabular figures, không chuyển thành "01/02" | Là số bài thật, không phải đánh số trang trí |
| Font hình học | Giữ Be Vietnam Pro (cần dấu tiếng Việt) | Không thêm font thứ hai |

## 4. Bản đồ sang repo

Nguyên tắc từ `AGENTS.md`: tái dùng component có sẵn trước, mở rộng bằng variant, không viết bản gần giống.

| Phần UI | Làm ở đâu |
|---|---|
| Thang `brand` xanh chàm + neutral hue xanh, bản light | `packages/config/theme.css`, ghi lại trong `docs/theme.md` và `DESIGN.md` |
| `Panel` (nền sáng bo `2xl` nổi trên nền `brand`) | `packages/ui/src`: kiểm tra `Card` trước, thêm variant thay vì component mới |
| `DuotoneImage` (ảnh một sắc xanh) | `packages/ui/src`, dùng CSS (`grayscale` + lớp màu `mix-blend`), ảnh gốc giữ nguyên |
| `TagChip`, `CategoryNav` (có số đếm, mục đang chọn) | mở rộng `Badge` hiện có; `CategoryNav` mới, nhận nhãn qua props |
| `ArticleCard` + biến thể nổi bật | `packages/ui/src`, nhận nhãn qua props (không gắn namespace i18n của app) |
| `SketchReveal` (tranh phác lộ dần) | `packages/ui/src`, chỉ `transform`/`clip-path`, có `prefers-reduced-motion` |
| Trang blog list + bài viết | `apps/web/app/[locale]/…`, chữ trong `packages/i18n/messages/{vi,en}/`. Blog đọc **server-only** theo `docs/blog.md` §7, không đổi sang React Query |
| Trang About (hero 2 cột + mục ba thẻ) | `apps/web`, thẻ ✕/✓ dùng `@iconify/react` |
| Story | `apps/storybook/src` |

## 5. Plan thực hiện (light trước)

1. **Token xanh bản light.** Chọn neo (gợi ý `#182D90` cho chữ nhấn, `#485BAB` primary, `#7787C4`/`#B3B4CC` tint), kiểm tra tương phản chữ/nền, cập nhật tài liệu. Chưa đụng dark.
2. **Nền móng component.** `Panel`, `DuotoneImage`, `TagChip`, `ArticleCard` (+ story, hai ngôn ngữ).
3. **Blog list.** Bố cục: cột trái tiêu đề + `CategoryNav`, phải ô lọc + lưới 2 cột lệch hàng, bài nổi bật đầu. Dùng API blog hiện có (xem `docs/blog.md`), không đoán shape.
4. **Bài viết.** Header (tag, tiêu đề, mô tả, tác giả, ngày), ảnh hero hai góc dưới bo lớn, thân bài giữ dòng đọc 45–75 ký tự.
5. **About.** Hero 2 cột (ô sứ mệnh + ô ảnh + panel chính), mục ba thẻ với `SketchReveal`.
6. **Chuyển động.** Stagger thẻ, tranh phác lộ dần, chuyển list → bài, parallax nhẹ; tất cả có fallback giảm chuyển động.
7. **Kiểm tra.** `pnpm check-messages`, `pnpm typecheck`, `pnpm lint`; chụp ở 1440 / 768 / 390 rồi so với khung hình trong `docs/reference/gas-for-africa/`.
8. **Sau cùng:** bản dark và đẩy lên Figma (lập checklist ở `docs/figma-sync.md` cho bạn tick trước).

## 6. Còn mở

- Phạm vi: chỉ trang công khai (blog, about, landing), hay đổi cả app?
- Hình: có sẵn ảnh/tranh phác của Noalhub không, hay vẽ SVG / tìm kho mở?
- Giữ viền 1px cho giống shot, hay theo quy tắc không viền?

## 7. Đã làm

- **Token:** thang `brand` hue ~214° (`docs/theme.md` §5.1); thêm `--field` (nền xanh cho panel) và `--tint` (nền thẻ đặc trên panel) trong `packages/config/theme.css`.
- **Component:** `Panel`, `DuotoneImage`, `Badge tone="brand"` trong `packages/ui/src`.
- **Trang chủ:** `apps/web/app/[locale]/(home)/page.tsx` gồm panel hero (header, tiêu đề, ba thẻ) và panel bài viết trên nền `bg-field`.
- **Hero:** `components/home/home-hero.tsx`. Nền là tranh toàn cảnh một thành phố cảng (litho "Panoramic view of the city and the wharf of Antwerp from the left bank", Egide Linnig, 1843, public domain, qua Wikimedia Commons), cắt đoạn giữa, chuyển thành nét mực nền trong suốt, quét mở trái → phải theo `docs/gsap_sketch_reveal_guide.md` (phương pháp A). Khác guide: nét mực tô bằng `--accent` qua mask hai lớp (hình + dải quét) để đổi màu theo light/dark; `--reveal` bắt đầu từ `-15%` (thấp hơn độ mềm 14%) nên lúc đầu trống hẳn; trạng thái đầu nằm trong CSS (`globals.css`), có failsafe nếu JS không tải.
- **Chuyển động nền (sau khi tranh vẽ xong):** năm con chim bay ngang bầu trời phía sau mái nhà (mỗi con tốc độ riêng, vỗ cánh), cả cảnh đung đưa vài px, và trôi chậm hơn nội dung khi cuộn (ScrollTrigger). Khi `prefers-reduced-motion: reduce`: giữ phần vào (chỉ mờ dần, không trượt), chim lướt chậm gấp 2,5 lần, không vỗ cánh, không đung đưa, không parallax.
- **Phụ thuộc mới:** `gsap`, `@gsap/react` (apps/web) — guide chọn GSAP để điều phối timeline.
- **Ảnh:** `apps/web/public/images/skyline-sketch.webp` (nền trong suốt, 180 KB, lọc nhiễu giấy và nếp gấp từ bản litho gốc).
- **Logo:** các token `--logo-*` trong `theme.css`, `icon.svg` (web, admin), `favicon.svg` (storybook), logo trong `.storybook/manager.tsx`, `theme_color` ở `manifest.ts` và hai icon raster (`apple-icon.png`, `icon-512.png`) đều đổi hue từ teal sang ~214°, giữ nguyên độ sáng và chroma (ví dụ `#113138` → `#0C3139`, `#469894` → `#3D96A9`, `#95D9BD` → `#81D7EB`).
- **Nền ngoài khung (`HomeField`):** nét khắc mái vòm phòng đọc (cùng bản khắc gỗ British Museum 1859, public domain) phủ lên `--field` bằng màu `--field-ink` (bậc sáng hơn cùng hue), cắt theo alpha của bản vẽ nên đổi màu theo light/dark. Lớp `fixed`, lớn hơn viewport 6% mỗi cạnh để không lộ mép khi chuyển động: trôi chậm theo cuộn trang (parallax), tự nhích và phình nhẹ trong 26s. Khi giảm chuyển động chỉ còn nhích rất chậm (70s), không parallax.
- **Hero trọn một màn hình:** panel hero cao `100svh` trừ viền nền (`calc(100svh - 4rem)` từ `md`), phần tranh nhận phần chiều cao còn lại (`flex-1`), tranh dính đáy nên màn hình cao chỉ có thêm trời, không bị kéo giãn. Thẻ rút gọn (bỏ hàng link, giữ mũi tên) để vừa 900px cao. Trên mobile hero dài hơn một màn hình vì ba thẻ xếp dọc.
