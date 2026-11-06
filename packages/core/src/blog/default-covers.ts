/**
 * 50 Domain Topics + 1 General Default for blog post cover SVGs.
 *
 * Provides intelligent topic resolution based on:
 * 1. Category slug / name (Weight: 100)
 * 2. Tags slugs / names (Weight: 50)
 * 3. Title keywords in Vietnamese (with/without accents) and English (Weight: 20)
 * Fallback: 'general-default'
 */

export type BlogCoverTopicId =
  // Group A: Technology & Software
  | 'software-engineering'
  | 'ai-machine-learning'
  | 'web-development'
  | 'mobile-development'
  | 'cloud-devops'
  | 'cybersecurity'
  | 'data-databases'
  | 'algorithms-systems'
  | 'robotics-hardware'
  | 'tools-workflow'
  // Group B: Sciences & Mathematics
  | 'mathematics'
  | 'physics'
  | 'astronomy-space'
  | 'biology-genetics'
  | 'neuroscience'
  | 'chemistry-materials'
  | 'nature-ecology'
  // Group C: Arts, Design & Culture
  | 'ui-ux-design'
  | 'typography'
  | 'visual-arts'
  | 'architecture'
  | 'music-sound'
  | 'literature-writing'
  | 'cinema-photography'
  | 'culture-heritage'
  // Group D: Philosophy, Psychology & Mind
  | 'philosophy'
  | 'psychology'
  | 'logic-critical-thinking'
  | 'mindfulness-zen'
  | 'linguistics-language'
  // Group E: Learning, Education & Habits
  | 'learning-study'
  | 'reading-books'
  | 'memory-cognition'
  | 'education-pedagogy'
  | 'productivity-habits'
  | 'qa-quizzes'
  | 'career-growth'
  // Group F: Society, Economics & Life
  | 'economics-finance'
  | 'business-strategy'
  | 'product-management'
  | 'law-legal'
  | 'sociology-community'
  | 'communication'
  | 'geography-travel'
  | 'health-wellness'
  | 'essays-reflections'
  | 'research-methodology'
  | 'history-civilization'
  | 'future-trends'
  | 'creativity-ideas'
  // Fallback
  | 'general-default'

export interface BlogCoverTopic {
  id: BlogCoverTopicId
  titleVi: string
  titleEn: string
  /** Primary accent color used in badges or highlights */
  accentColor: string
  /** Category or tag slug aliases that directly trigger this topic */
  slugAliases: string[]
  /** Keywords for scoring against titles and tags */
  keywords: string[]
}

/**
 * Remove Vietnamese diacritics for robust accent-insensitive matching.
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Check if text contains a keyword as a whole word or boundary-delimited phrase.
 * Prevents short keywords like 'ai' or 've' from matching substrings inside 'bai viet' or 'cover'.
 */
export function matchesKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i')
  return regex.test(text)
}

export const BLOG_COVER_TOPICS: Record<BlogCoverTopicId, BlogCoverTopic> = {
  // --- Group A: Technology & Software ---
  'software-engineering': {
    id: 'software-engineering',
    titleVi: 'Kỹ thuật Phần mềm',
    titleEn: 'Software Engineering',
    accentColor: '#00b6d2',
    slugAliases: ['ky-thuat', 'software', 'engineering', 'backend', 'clean-code', 'lap-trinh'],
    keywords: [
      'ky thuat', 'phan mem', 'software', 'engineering', 'code', 'coding', 'architecture',
      'refactor', 'he thong', 'backend', 'lap trinh', 'clean code', 'design pattern',
    ],
  },
  'ai-machine-learning': {
    id: 'ai-machine-learning',
    titleVi: 'Trí tuệ Nhân tạo & ML',
    titleEn: 'AI & Machine Learning',
    accentColor: '#3cdbfa',
    slugAliases: ['ai', 'machine-learning', 'tri-tue-nhan-tao', 'deep-learning', 'llm', 'genai'],
    keywords: [
      'tri tue nhan tao', 'ai', 'machine learning', 'deep learning', 'neural', 'llm',
      'genai', 'gpt', 'model', 'mo hinh', 'hoc may', 'mang nơ-ron', 'tri tue',
    ],
  },
  'web-development': {
    id: 'web-development',
    titleVi: 'Lập trình Web & Frontend',
    titleEn: 'Web Development',
    accentColor: '#38bdf8',
    slugAliases: ['web', 'frontend', 'css', 'react', 'nextjs', 'html', 'javascript', 'typescript'],
    keywords: [
      'web', 'frontend', 'css', 'html', 'react', 'nextjs', 'javascript', 'typescript',
      'giao dien web', 'tailwind', 'component', 'dom', 'browser', 'trinh duyet',
    ],
  },
  'mobile-development': {
    id: 'mobile-development',
    titleVi: 'Lập trình Di động',
    titleEn: 'Mobile Development',
    accentColor: '#60a5fa',
    slugAliases: ['mobile', 'ios', 'android', 'react-native', 'flutter', 'di-dong'],
    keywords: [
      'mobile', 'di dong', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native',
      'ung dung di dong', 'smartphone', 'dien thoai', 'app mobile',
    ],
  },
  'cloud-devops': {
    id: 'cloud-devops',
    titleVi: 'Đám mây & DevOps',
    titleEn: 'Cloud & DevOps',
    accentColor: '#2dd4bf',
    slugAliases: ['cloud', 'devops', 'docker', 'kubernetes', 'ci-cd', 'aws', 'dam-may'],
    keywords: [
      'cloud', 'devops', 'dam may', 'docker', 'kubernetes', 'ci cd', 'deploy', 'ha tang',
      'infrastructure', 'aws', 'serverless', 'pipeline', 'container',
    ],
  },
  'cybersecurity': {
    id: 'cybersecurity',
    titleVi: 'An ninh mạng & Bảo mật',
    titleEn: 'Cybersecurity & Privacy',
    accentColor: '#f43f5e',
    slugAliases: ['security', 'bao-mat', 'an-ninh-mang', 'privacy', 'cryptography'],
    keywords: [
      'bao mat', 'an ninh mang', 'security', 'privacy', 'quyen rieng tu', 'ma hoa',
      'cryptography', 'xac thuc', 'auth', 'tan cong', 'vulnerability', 'firewall',
    ],
  },
  'data-databases': {
    id: 'data-databases',
    titleVi: 'Dữ liệu & Cơ sở dữ liệu',
    titleEn: 'Data & Databases',
    accentColor: '#0ea5e9',
    slugAliases: ['database', 'data', 'sql', 'du-lieu', 'co-so-du-lieu', 'analytics'],
    keywords: [
      'du lieu', 'co so du lieu', 'database', 'sql', 'nosql', 'postgres', 'data',
      'analytics', 'phan tich du lieu', 'truy van', 'index', 'big data',
    ],
  },
  'algorithms-systems': {
    id: 'algorithms-systems',
    titleVi: 'Thuật toán & Cấu trúc',
    titleEn: 'Algorithms & Structures',
    accentColor: '#a855f7',
    slugAliases: ['algorithm', 'thuat-toan', 'data-structures', 'cau-truc-du-lieu'],
    keywords: [
      'thuat toan', 'algorithm', 'cau truc du lieu', 'complexity', 'do phuc tap',
      'binary search', 'sap xep', 'tree', 'graph', 'quy hoach dong', 'dijkstra',
    ],
  },
  'robotics-hardware': {
    id: 'robotics-hardware',
    titleVi: 'Robot & Phần cứng',
    titleEn: 'Robotics & Hardware',
    accentColor: '#f59e0b',
    slugAliases: ['robotics', 'hardware', 'phan-cung', 'iot', 'mach-dien'],
    keywords: [
      'robot', 'robotics', 'phan cung', 'hardware', 'iot', 'mach dien', 'vi xu ly',
      'chip', 'bán dẫn', 'cam bien', 'tu dong hoa', 'arduino',
    ],
  },
  'tools-workflow': {
    id: 'tools-workflow',
    titleVi: 'Công cụ & Quy trình',
    titleEn: 'Tools & Workflows',
    accentColor: '#64748b',
    slugAliases: ['tools', 'cong-cu', 'workflow', 'git', 'cli', 'quy-trinh'],
    keywords: [
      'cong cu', 'tools', 'quy trinh', 'workflow', 'git', 'terminal', 'cli',
      'hieu suat lam viec', 'moi truong phat trien', 'ide', 'vscode',
    ],
  },

  // --- Group B: Sciences & Mathematics ---
  'mathematics': {
    id: 'mathematics',
    titleVi: 'Toán học & Tô pô',
    titleEn: 'Mathematics & Topology',
    accentColor: '#8b5cf6',
    slugAliases: ['toan-hoc', 'math', 'mathematics', 'dai-so', 'hinh-hoc'],
    keywords: [
      'toan hoc', 'math', 'mathematics', 'dai so', 'hinh hoc', 'xac suat', 'thong ke',
      'giai tich', 'calculus', 'phuong trinh', 'dinh ly', 'fibonacci', 'to po',
    ],
  },
  'physics': {
    id: 'physics',
    titleVi: 'Vật lý học & Lượng tử',
    titleEn: 'Physics & Quantum',
    accentColor: '#06b6d4',
    slugAliases: ['vat-ly', 'physics', 'quantum', 'luong-tu'],
    keywords: [
      'vat ly', 'physics', 'luong tu', 'quantum', 'co hoc', 'tuong doi', 'hat',
      'nang luong', 'nhiet dong luc', 'quang hoc', 'dien tu', 'song',
    ],
  },
  'astronomy-space': {
    id: 'astronomy-space',
    titleVi: 'Thiên văn & Vũ trụ',
    titleEn: 'Astronomy & Cosmos',
    accentColor: '#6366f1',
    slugAliases: ['thien-van', 'vu-tru', 'astronomy', 'space', 'cosmos'],
    keywords: [
      'thien van', 'vu tru', 'astronomy', 'space', 'cosmos', 'ngoi sao', 'chom sao',
      'hanh tinh', 'ngan ha', 'galaxy', 'ho den', 'mat troi', 'mat trang', 'quy dao',
      'tinh van', 'sao bang',
    ],
  },
  'biology-genetics': {
    id: 'biology-genetics',
    titleVi: 'Sinh học & Di truyền',
    titleEn: 'Biology & Genetics',
    accentColor: '#10b981',
    slugAliases: ['sinh-hoc', 'biology', 'genetics', 'dna', 'di-truyen'],
    keywords: [
      'sinh hoc', 'biology', 'di truyen', 'genetics', 'dna', 'te bao', 'tien hoa',
      'sinh thai', 'gene', 'vi sinh', 'phan tu', 'co the song',
    ],
  },
  'neuroscience': {
    id: 'neuroscience',
    titleVi: 'Khoa học Thần kinh',
    titleEn: 'Neuroscience & Brain',
    accentColor: '#ec4899',
    slugAliases: ['than-kinh', 'neuroscience', 'nao-bo', 'brain'],
    keywords: [
      'than kinh', 'neuroscience', 'nao bo', 'brain', 'synapse', 'nhan thuc',
      'tri nho', 'te bao than kinh', 'neuron', 'song nao',
    ],
  },
  'chemistry-materials': {
    id: 'chemistry-materials',
    titleVi: 'Hóa học & Vật liệu',
    titleEn: 'Chemistry & Materials',
    accentColor: '#14b8a6',
    slugAliases: ['hoa-hoc', 'chemistry', 'vat-lieu', 'materials'],
    keywords: [
      'hoa hoc', 'chemistry', 'vat lieu', 'materials', 'phan ung', 'nguyen to',
      'phan tu', 'tinh the', 'polyme', 'hop chat', 'phong thi nghiem',
    ],
  },
  'nature-ecology': {
    id: 'nature-ecology',
    titleVi: 'Tự nhiên & Môi trường',
    titleEn: 'Nature & Ecology',
    accentColor: '#059669',
    slugAliases: ['moi-truong', 'nature', 'ecology', 'khi-hau', 'tu-nhien'],
    keywords: [
      'moi truong', 'tu nhien', 'nature', 'ecology', 'khi hau', 'bien doi khi hau',
      'rung', 'dai duong', 'he sinh thai', 'da dang sinh hoc', 'bao ton',
    ],
  },

  // --- Group C: Arts, Design & Culture ---
  'ui-ux-design': {
    id: 'ui-ux-design',
    titleVi: 'Thiết kế UI/UX & Giao diện',
    titleEn: 'UI/UX & Product Design',
    accentColor: '#00b6d2',
    slugAliases: ['ui-ux', 'design', 'thiet-ke', 'interface', 'trai-nghiem'],
    keywords: [
      'thiet ke', 'ui', 'ux', 'design', 'giao dien', 'trai nghiem nguoi dung',
      'figma', 'design system', 'prototype', 'usability', 'layout', 'wireframe',
      'he mau', 'sang toi', 'dark mode', 'che do toi', 'theme', 'mau sac',
    ],
  },
  'typography': {
    id: 'typography',
    titleVi: 'Nghệ thuật Kiểu chữ',
    titleEn: 'Typography & Lettering',
    accentColor: '#f97316',
    slugAliases: ['typography', 'font', 'chu', 'kieu-chu'],
    keywords: [
      'typography', 'kieu chu', 'font chu', 'chu viet', 'lettering', 'type',
      'serif', 'sans serif', 'khoang cach chu', 'dan trang',
    ],
  },
  'visual-arts': {
    id: 'visual-arts',
    titleVi: 'Mỹ thuật & Thị giác',
    titleEn: 'Visual Arts & Painting',
    accentColor: '#d946ef',
    slugAliases: ['my-thuat', 'art', 'hoi-hoa', 'visual-arts', 'nghe-thuat'],
    keywords: [
      'my thuat', 'hoi hoa', 'art', 'nghe thuat', 'tranh', 've', 'mau sac',
      'trien lam', 'dieu khac', 'visual', 'thi giac', 'phong cach',
    ],
  },
  'architecture': {
    id: 'architecture',
    titleVi: 'Kiến trúc & Không gian',
    titleEn: 'Architecture & Space',
    accentColor: '#78716c',
    slugAliases: ['kien-truc', 'architecture', 'khong-gian', 'do-thi'],
    keywords: [
      'kien truc', 'architecture', 'khong gian', 'toa nha', 'do thi', 'ket cau',
      'vat lieu kien truc', 'cong trinh', 'xay dung', 'quy hoach',
    ],
  },
  'music-sound': {
    id: 'music-sound',
    titleVi: 'Âm nhạc & Sóng âm',
    titleEn: 'Music & Acoustics',
    accentColor: '#8b5cf6',
    slugAliases: ['am-nhac', 'music', 'sound', 'am-thanh', 'nhac-ly'],
    keywords: [
      'am nhac', 'music', 'am thanh', 'sound', 'nhac ly', 'giai dieu', 'nhip dieu',
      'bai hat', 'nhac cu', 'hoa am', 'song am', 'tai nghe', 'nhac co dien', 'nhac',
      'thinh phong', 'audio', 'acoustic',
    ],
  },
  'literature-writing': {
    id: 'literature-writing',
    titleVi: 'Văn học & Nghệ thuật viết',
    titleEn: 'Literature & Writing',
    accentColor: '#ea580c',
    slugAliases: ['van-hoc', 'literature', 'viet-lach', 'writing', 'tho-ca'],
    keywords: [
      'van hoc', 'literature', 'viet lach', 'writing', 'cau chuyen', 'ke chuyen',
      'tac pham', 'tieu thuyet', 'tho ca', 'ngon tu', 'bien soan',
    ],
  },
  'cinema-photography': {
    id: 'cinema-photography',
    titleVi: 'Điện ảnh & Nhiếp ảnh',
    titleEn: 'Cinema & Photography',
    accentColor: '#e11d48',
    slugAliases: ['dien-anh', 'cinema', 'nhiep-anh', 'photography', 'phim'],
    keywords: [
      'dien anh', 'cinema', 'nhiep anh', 'photography', 'phim', 'may anh', 'ong kinh',
      'khung hinh', 'anh sang', 'kich ban', 'dao dien', 'thuoc phim',
    ],
  },
  'culture-heritage': {
    id: 'culture-heritage',
    titleVi: 'Văn hóa & Di sản',
    titleEn: 'Culture & Heritage',
    accentColor: '#b45309',
    slugAliases: ['van-hoa', 'culture', 'di-san', 'heritage', 'truyen-thong'],
    keywords: [
      'van hoa', 'culture', 'di san', 'heritage', 'truyen thong', 'phong tuc',
      'le hoi', 'dan gian', 'ban sac', 'lich su van hoa',
    ],
  },

  // --- Group D: Philosophy, Psychology & Mind ---
  'philosophy': {
    id: 'philosophy',
    titleVi: 'Triết học & Hiện sinh',
    titleEn: 'Philosophy & Existence',
    accentColor: '#475569',
    slugAliases: ['triet-hoc', 'philosophy', 'hien-sinh', 'dao-duc'],
    keywords: [
      'triet hoc', 'philosophy', 'hien sinh', 'dao duc', 'nhan thuc luan',
      'tu tuong', 'y nghia cuoc song', 'chan ly', 'triet gia', 'suy tu',
    ],
  },
  'psychology': {
    id: 'psychology',
    titleVi: 'Tâm lý học & Hành vi',
    titleEn: 'Psychology & Behavior',
    accentColor: '#f43f5e',
    slugAliases: ['tam-ly', 'psychology', 'hanh-vi', 'cam-xuc'],
    keywords: [
      'tam ly', 'psychology', 'hanh vi', 'cam xuc', 'nhan thuc', 'tinh than',
      'noi tam', 'noi so', 'dong luc', 'thao tung', 'tam tri', 'vo thuc',
    ],
  },
  'logic-critical-thinking': {
    id: 'logic-critical-thinking',
    titleVi: 'Logic & Tư duy Phản biện',
    titleEn: 'Logic & Critical Thinking',
    accentColor: '#0284c7',
    slugAliases: ['logic', 'phan-bien', 'critical-thinking', 'tu-duy'],
    keywords: [
      'logic', 'tu duy phan bien', 'critical thinking', 'lap luan', 'nguy bien',
      'suy luan', 'chung minh', 'phan tich', 'thien kien', 'khach quan',
    ],
  },
  'mindfulness-zen': {
    id: 'mindfulness-zen',
    titleVi: 'Chánh niệm & Tĩnh lặng',
    titleEn: 'Mindfulness & Zen',
    accentColor: '#10b981',
    slugAliases: ['chanh-niem', 'mindfulness', 'zen', 'thien', 'tinh-lang'],
    keywords: [
      'chanh niem', 'mindfulness', 'zen', 'thien', 'tinh lang', 'an yen',
      'binh an', 'tho deu', 'buong bo', 'tinh tam', 'cham rai', 'song cham',
    ],
  },
  'linguistics-language': {
    id: 'linguistics-language',
    titleVi: 'Ngôn ngữ & Ngữ nghĩa',
    titleEn: 'Linguistics & Languages',
    accentColor: '#6366f1',
    slugAliases: ['ngon-ngu', 'linguistics', 'tieng-anh', 'ngu-phap'],
    keywords: [
      'ngon ngu', 'linguistics', 'tieng anh', 'ngoai ngu', 'ngu phap', 'tu vung',
      'ngu nghia', 'am tiet', 'giao tiep ngon ngu', 'dich thuat',
    ],
  },

  // --- Group E: Learning, Education & Habits ---
  'learning-study': {
    id: 'learning-study',
    titleVi: 'Phương pháp Học tập',
    titleEn: 'Learning & Study Methods',
    accentColor: '#0097af',
    slugAliases: ['hoc-tap', 'learning', 'study', 'tu-hoc', 'phuong-phap-hoc'],
    keywords: [
      'hoc tap', 'learning', 'study', 'tu hoc', 'phuong phap hoc', 'on tap',
      'nhip dieu', 'luyen tap', 'ky nang', 'ghi nho', 'ghi chep', 'active recall',
      'hoc', 'hoc it', 'hoc moi ngay', 'tu duy hoc', 'on thi',
    ],
  },
  'reading-books': {
    id: 'reading-books',
    titleVi: 'Đọc sách & Thư viện',
    titleEn: 'Reading & Libraries',
    accentColor: '#d97706',
    slugAliases: ['sach', 'doc-sach', 'books', 'reading', 'thu-vien'],
    keywords: [
      'sach', 'doc sach', 'books', 'reading', 'thu vien', 'cuon sach', 'trang sach',
      'doc cham', 'diem sach', 'review sach', 'sach hay',
    ],
  },
  'memory-cognition': {
    id: 'memory-cognition',
    titleVi: 'Trí nhớ & Lưu trữ',
    titleEn: 'Memory & Retention',
    accentColor: '#8b5cf6',
    slugAliases: ['tri-nho', 'memory', 'spaced-repetition', 'anki'],
    keywords: [
      'tri nho', 'memory', 'spaced repetition', 'lap lai ngat quang', 'ghi nho',
      'luu tru', 'quen lang', 'duong cong quen', 'flashcard', 'nho lau',
    ],
  },
  'education-pedagogy': {
    id: 'education-pedagogy',
    titleVi: 'Giáo dục & Sư phạm',
    titleEn: 'Education & Pedagogy',
    accentColor: '#2563eb',
    slugAliases: ['giao-duc', 'education', 'su-pham', 'day-hoc'],
    keywords: [
      'giao duc', 'education', 'su pham', 'day hoc', 'truong hoc', 'hoc sinh',
      'sinh vien', 'giao vien', 'giao trinh', 'chuong trinh hoc', 'khoa hoc',
    ],
  },
  'productivity-habits': {
    id: 'productivity-habits',
    titleVi: 'Năng suất & Thói quen',
    titleEn: 'Productivity & Habits',
    accentColor: '#16a34a',
    slugAliases: ['nang-suat', 'productivity', 'thoi-quen', 'habits', 'tap-trung'],
    keywords: [
      'nang suat', 'productivity', 'thoi quen', 'habits', 'tap trung', 'quan ly thoi gian',
      'ky luat', 'pomodoro', 'ke hoach', 'muc tieu', 'tri hoan',
    ],
  },
  'qa-quizzes': {
    id: 'qa-quizzes',
    titleVi: 'Hỏi đáp & Trắc nghiệm',
    titleEn: 'Q&A & Quizzes',
    accentColor: '#00b6d2',
    slugAliases: ['qa', 'quiz', 'trac-nghiem', 'hoi-dap', 'cau-hoi'],
    keywords: [
      'hoi dap', 'cau hoi', 'trac nghiem', 'quiz', 'qa', 'sinh cau hoi', 'kiem tra',
      'dap an', 'on luyen', 'do vui', 'challenge',
    ],
  },
  'career-growth': {
    id: 'career-growth',
    titleVi: 'Sự nghiệp & Phát triển',
    titleEn: 'Career & Growth',
    accentColor: '#0284c7',
    slugAliases: ['su-nghiep', 'career', 'phat-trien', 'growth', 'cong-viec'],
    keywords: [
      'su nghiep', 'career', 'cong viec', 'phong van', 'cv', 'thang tien',
      'phat trien ban than', 'kinh nghiem', 'chuyen mon', 'dinh huong',
    ],
  },

  // --- Group F: Society, Economics & Life ---
  'economics-finance': {
    id: 'economics-finance',
    titleVi: 'Kinh tế & Tài chính',
    titleEn: 'Economics & Finance',
    accentColor: '#10b981',
    slugAliases: ['kinh-te', 'tai-chinh', 'economics', 'finance', 'dau-tu'],
    keywords: [
      'kinh te', 'tai chinh', 'economics', 'finance', 'dau tu', 'tien te', 'thi truong',
      'lam phat', 'lai suat', 'chung khoan', 'ngan sach', 'kinh te hoc',
    ],
  },
  'business-strategy': {
    id: 'business-strategy',
    titleVi: 'Chiến lược & Kinh doanh',
    titleEn: 'Business & Strategy',
    accentColor: '#0369a1',
    slugAliases: ['kinh-doanh', 'business', 'chien-luoc', 'strategy', 'startup'],
    keywords: [
      'kinh doanh', 'business', 'chien luoc', 'strategy', 'khoi nghiep', 'startup',
      'doanh nghiep', 'mo hinh kinh doanh', 'canh tranh', 'doanh thu',
    ],
  },
  'product-management': {
    id: 'product-management',
    titleVi: 'Quản lý Sản phẩm',
    titleEn: 'Product Management',
    accentColor: '#f59e0b',
    slugAliases: ['san-pham', 'product', 'product-management', 'roadmap', 'feature'],
    keywords: [
      'san pham', 'product', 'product management', 'tinh nang', 'feature', 'roadmap',
      'ra mat', 'nguoi dung', 'nhu cau', 'khao sat', 'metric', 'mvp',
    ],
  },
  'law-legal': {
    id: 'law-legal',
    titleVi: 'Pháp luật & Chính sách',
    titleEn: 'Law & Policy',
    accentColor: '#64748b',
    slugAliases: ['phap-luat', 'law', 'legal', 'chinh-sach', 'dieu-khoan'],
    keywords: [
      'phap luat', 'law', 'legal', 'chinh sach', 'dieu khoan', 'ban quyen',
      'hop dong', 'quyen loi', 'trach nhiem', 'toa an', 'quy dinh',
    ],
  },
  'sociology-community': {
    id: 'sociology-community',
    titleVi: 'Xã hội & Cộng đồng',
    titleEn: 'Sociology & Community',
    accentColor: '#ec4899',
    slugAliases: ['xa-hoi', 'cong-dong', 'sociology', 'community'],
    keywords: [
      'xa hoi', 'cong dong', 'sociology', 'community', 'con nguoi', 'ket noi',
      'moi quan he', 'tap the', 'van minh', 'xu huong xa hoi',
    ],
  },
  'communication': {
    id: 'communication',
    titleVi: 'Giao tiếp & Đối thoại',
    titleEn: 'Communication & Dialogue',
    accentColor: '#0ea5e9',
    slugAliases: ['giao-tiep', 'communication', 'doi-thoai', 'thuyet-trinh'],
    keywords: [
      'giao tiep', 'communication', 'doi thoai', 'thuyet trinh', 'lang nghe',
      'dam phan', 'chia se', 'truyen dat', 'dien dat', 'thuyet phuc',
    ],
  },
  'geography-travel': {
    id: 'geography-travel',
    titleVi: 'Địa lý & Du hành',
    titleEn: 'Geography & Travel',
    accentColor: '#14b8a6',
    slugAliases: ['dia-ly', 'geography', 'du-lich', 'travel', 'kham-pha'],
    keywords: [
      'dia ly', 'geography', 'du lich', 'travel', 'kham pha', 'vung dat', 'ban do',
      'quoc gia', 'chau luc', 'hanh trinh', 'dia hinh', 'thien nhien',
    ],
  },
  'health-wellness': {
    id: 'health-wellness',
    titleVi: 'Sức khỏe & Đời sống',
    titleEn: 'Health & Wellness',
    accentColor: '#22c55e',
    slugAliases: ['suc-khoe', 'health', 'wellness', 'y-hoc', 'dinh-duong'],
    keywords: [
      'suc khoe', 'health', 'wellness', 'y hoc', 'dinh duong', 'the duc',
      'giac ngu', 'the chat', 'nang luong', 'song khoe', 'phong ngua',
    ],
  },
  'essays-reflections': {
    id: 'essays-reflections',
    titleVi: 'Tản văn & Chiêm nghiệm',
    titleEn: 'Essays & Reflections',
    accentColor: '#eab308',
    slugAliases: ['tan-van', 'essays', 'chiem-nghiem', 'suy-ngam', 'nhat-ky'],
    keywords: [
      'tan van', 'essays', 'chiem nghiem', 'suy ngam', 'nhat ky', 'goc nhin',
      'trai nghiem', 'cam nghi', 'tam su', 'ky uc', 'thoi gian',
    ],
  },
  'research-methodology': {
    id: 'research-methodology',
    titleVi: 'Nghiên cứu & Thí nghiệm',
    titleEn: 'Research & Methodology',
    accentColor: '#6366f1',
    slugAliases: ['nghien-cuu', 'research', 'methodology', 'thi-nghiem'],
    keywords: [
      'nghien cuu', 'research', 'phuong phap', 'methodology', 'thi nghiem',
      'gia thuyet', 'khao sat', 'so lieu', 'khoa hoc', 'luan van',
    ],
  },
  'history-civilization': {
    id: 'history-civilization',
    titleVi: 'Lịch sử & Các nền văn minh',
    titleEn: 'History & Civilization',
    accentColor: '#92400e',
    slugAliases: ['lich-su', 'history', 'van-minh', 'civilization', 'co-dai'],
    keywords: [
      'lich su', 'history', 'van minh', 'civilization', 'co dai', 'thoi dai',
      'chien tranh', 'trieu dai', 'khao co', 'qua khu', 'tien hoa',
    ],
  },
  'future-trends': {
    id: 'future-trends',
    titleVi: 'Xu hướng & Tương lai',
    titleEn: 'Future Trends & Horizons',
    accentColor: '#a855f7',
    slugAliases: ['tuong-lai', 'future', 'trends', 'xu-huong', 'doi-moi'],
    keywords: [
      'tuong lai', 'future', 'xu huong', 'trends', 'doi moi', 'cong nghe moi',
      'tam nhin', 'du bao', 'ky nguyen', 'chuyen doi', 'dot pha',
    ],
  },
  'creativity-ideas': {
    id: 'creativity-ideas',
    titleVi: 'Sáng tạo & Ý tưởng',
    titleEn: 'Creativity & Ideas',
    accentColor: '#f43f5e',
    slugAliases: ['sang-tao', 'creativity', 'y-tuong', 'ideas', 'cam-hung'],
    keywords: [
      'sang tao', 'creativity', 'y tuong', 'ideas', 'cam hung', 'khoi dau',
      'phat minh', 'tu duy sang tao', 'y tuong moi', 'tia sang',
    ],
  },

  // --- Fallback Default ---
  'general-default': {
    id: 'general-default',
    titleVi: 'Khám phá & Tri thức',
    titleEn: 'Knowledge & Discovery',
    accentColor: '#00798d',
    slugAliases: ['general', 'default', 'tong-hop', 'tat-ca'],
    keywords: [
      'tri thuc', 'kham pha', 'noalhub', 'bai viet', 'kien thuc', 'tong hop',
    ],
  },
}

/**
 * Predicts and resolves the best matching cover topic for a blog post.
 */
export function resolvePostCoverTopic(post: {
  category?: { slug?: string; name?: string } | null
  tags?: Array<{ slug?: string; name?: string }> | null
  title?: string | null
}): BlogCoverTopic {
  const categorySlug = (post.category?.slug ?? '').toLowerCase().trim()
  const categoryName = (post.category?.name ?? '').toLowerCase().trim()
  const tags = (post.tags ?? []).map((t) => ({
    slug: (t.slug ?? '').toLowerCase().trim(),
    name: (t.name ?? '').toLowerCase().trim(),
  }))
  const title = post.title ?? ''
  const cleanTitle = removeDiacritics(title)

  let bestTopic: BlogCoverTopic = BLOG_COVER_TOPICS['general-default']
  let highestScore = 0

  for (const topic of Object.values(BLOG_COVER_TOPICS)) {
    if (topic.id === 'general-default') continue

    let score = 0

    // 1. Direct Category Match (Weight: 100)
    if (categorySlug && topic.slugAliases.includes(categorySlug)) {
      score += 100
    }
    const cleanCatName = removeDiacritics(categoryName)
    if (cleanCatName && topic.keywords.some((kw) => matchesKeyword(cleanCatName, kw))) {
      score += 70
    }

    // 2. Tag Matches (Weight: 50 per match)
    for (const tag of tags) {
      if (tag.slug && topic.slugAliases.includes(tag.slug)) {
        score += 50
      }
      const cleanTagName = removeDiacritics(tag.name)
      if (cleanTagName && topic.keywords.some((kw) => matchesKeyword(cleanTagName, kw))) {
        score += 40
      }
    }

    // 3. Title Keyword Matches (Weighted by phrase specificity)
    if (cleanTitle) {
      for (const kw of topic.keywords) {
        if (matchesKeyword(cleanTitle, kw)) {
          const wordCount = kw.trim().split(/\s+/).length
          score += 15 + wordCount * 10
        }
      }
    }

    if (score > highestScore) {
      highestScore = score
      bestTopic = topic
    }
  }

  // If score is 0, return default
  if (highestScore === 0) {
    return BLOG_COVER_TOPICS['general-default']
  }

  return bestTopic
}

/**
 * Resolves the image URL to use for a post:
 * If the post has a valid coverImageUrl, use it.
 * Otherwise, returns the SVG path for the predicted topic.
 */
export function getPostCoverUrl(post: {
  coverImageUrl?: string | null
  category?: { slug?: string; name?: string } | null
  tags?: Array<{ slug?: string; name?: string }> | null
  title?: string | null
}): string {
  if (post.coverImageUrl && post.coverImageUrl.trim().length > 0) {
    return post.coverImageUrl
  }
  const topic = resolvePostCoverTopic(post)
  return `/images/default-covers/${topic.id}.svg`
}
