# Q&A — bề mặt người học và yêu cầu backend

> Backend đã làm theo tài liệu này (`noalhub-be`: migration `1755200000000-AddQaItemDatasetId`, `docs/qa.md` §12). Mục 2–3 giữ lại để ghi lý do.

Người học chỉ thấy **dataset**: mỗi dataset là một bộ câu hỏi gồm các câu đã duyệt và đã publish.
Set, outline, generation chỉ tồn tại ở phía admin.

## 1. Mô hình dữ liệu

```
dataset ─┬─ sources
         ├─ outlines (nhiều version, isCurrent)
         ├─ generations (outlineId, promptSnapshot, model…)
         └─ sets (outlineId, generationId, sectionAnchor, isFinal)
              └─ items
```

- Một dataset có nhiều version outline; bất kỳ version nào cũng generate được ra một batch câu hỏi (set).
- Admin duyệt từng câu (`reviewStatus`: `pending` / `approved` / `rejected`).
- Câu `approved` được **copy** sang final set (`sourceItemId` trỏ về bản nháp). Bản copy là thứ người học làm bài:
  sửa bản nháp không làm đổi lịch sử làm bài.
- Final set và bản nháp dùng chung bảng `qa_item`.

## 2. Yêu cầu backend

**`qa_item.dataset_id`**
- Thêm cột `dataset_id` (FK → dataset, `ON DELETE CASCADE`), backfill từ `qa_set.dataset_id`, rồi đặt `NOT NULL`.
- Luôn bằng `set.dataset_id` (service gán khi tạo; có thể thêm composite FK `(set_id, dataset_id)`).
- Index `(dataset_id, review_status)` và `(dataset_id, published)`.
- `UNIQUE (source_item_id)` để bấm "Thêm vào final set" hai lần không tạo bản sao. Không chống trùng nội dung giữa các version outline.
- `QaItemFull` trả thêm `datasetId`.

**Outline bất biến khi đã có generation**: `PUT` outline đã được generation/set tham chiếu thì trả 409, sửa thì tạo version mới.
Nếu chưa làm được, tối thiểu snapshot `sectionAnchor` / `sectionTitle` lên item hoặc set.

**Cờ trạng thái**: bản nháp chỉ dùng `reviewStatus`; `published` chỉ có nghĩa với item của final set (nháp luôn `false`).

## 3. API người học (contract FE đang gọi)

Tất cả cần Bearer; dataset không có câu published nào trả 404 y hệt dataset không tồn tại.

| Method | Path | Trả về |
|---|---|---|
| GET | `/qa/datasets` | `{ items: QaDatasetSummary[], total }` — chỉ dataset có ≥1 item published |
| GET | `/qa/datasets/{id}` | `QaDatasetPlay` — các `QaItemPlay` published, **không** có đáp án |
| POST | `/qa/datasets/{id}/attempts` | `QaAttempt` — idempotent theo (user, dataset) |
| GET | `/qa/attempts?datasetId=` | `QaAttempt[]` |
| GET | `/qa/items?datasetId=&kind=&wrongOnly=` | giữ nguyên, nhưng item trả thêm `templateKey` |

`QaAttempt.setId` đổi thành `datasetId`. Các route `/qa/attempts/{id}/answers`, `/finish` giữ nguyên.

Hình dạng (xem `packages/api/src/qa/types.ts`):

- `QaDatasetSummary`: `id, title, description, itemCount, itemKinds[], templateKeys[], difficulties[], openAttemptId, updatedAt`.
  `itemCount` đếm **câu published**, không đếm câu nháp.
- `QaDatasetPlay`: `id, title, description, itemCount, items: QaItemPlay[]`.
- `QaItemPlay` có thêm `templateKey` (kiểu input theo **từng câu**, vì một dataset trộn nhiều dạng).

Khuyến nghị: chốt danh sách câu tại lúc start attempt (snapshot) để mẫu số tiến độ không đổi khi admin publish thêm
câu lúc người học đang làm dở. Nếu không snapshot, FE chấp nhận mẫu số động (8/10 → 8/11).

## 4. Phía FE

| Màn hình | Route (web) | Route (mobile) |
|---|---|---|
| Danh sách bộ câu hỏi | `/learn` | `/learn` |
| Giới thiệu bộ + chọn số câu + Start/Continue | modal trên `/learn` (không có route riêng) | `/learn/datasets/[id]` |
| Làm bài | `/learn/sets/[id]` (id của **bộ câu hỏi**; mỗi lần mở gọi `startAttempt` — idempotent — để lấy lượt đang mở, nên reload hoặc đổi thiết bị luôn đồng bộ) | `/learn/attempts/[id]` |
| Xem lại | `/learn/attempts/[id]/review` | `/learn/attempts/[id]` |

- Hook: `useBrowseQaDatasets`, `usePlayQaDataset`, `useQaAttempts(datasetId?)`, `useStartQaAttempt`.
- `AnswerInput` (web) lấy `templateKey` từ item. Câu trả lời dạng "tự chấm" (flashcard) hiển thị bằng wording "đã biết"
  chỉ khi **cả bộ** là flashcard; bộ trộn dùng wording "đúng".
- Admin (Step 4, outline, set) không đổi: `useQaFinalSet(datasetId)` vẫn nhóm theo section.

## 5. Chọn số câu trước khi làm

Modal (web) và màn giới thiệu (mobile) cho chọn **5 / 10 / 20 / tất cả** (`QA_COUNT_OPTIONS`; chỉ hiện cỡ nhỏ hơn
số câu của bộ). `POST /qa/datasets/{id}/attempts` nhận `{ count? }`; backend bốc ngẫu nhiên và **chốt** mẫu vào
`qa_attempt_items`, nên:

- `QaAttempt.itemCount` là mẫu số tiến độ, không đổi giữa chừng.
- Màn làm bài đọc `GET /qa/attempts/{id}` → `QaAttemptPlay { attempt, datasetTitle, items }` thay vì cả dataset.
- Lượt đang mở thì `count` bị bỏ qua; modal ẩn phần chọn và nút ghi "Continue".
