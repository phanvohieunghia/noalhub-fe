import { Typography } from "@noalhub/ui/typography"; /**
 * Tin `type: "system"` — biến động thành viên, đổi tên nhóm…
 *
 * Render khác hẳn bubble thường: một dòng nhỏ căn giữa, không avatar, không
 * timestamp, không đứng về phía ai. Enum này đã có trong spec dù giai đoạn 1
 * chưa có event nào sinh ra nó.
 */
export function MessageSystemNotice({ body }: { body: string }) {
  return (
    <Typography variant="body-4" className="py-1 text-center opacity-60">
      {body}
    </Typography>
  );
}
