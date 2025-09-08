// Konfigurasi front end – sesuaikan dengan API kamu
window.APP_CONFIG = {
  // Same-origin dengan server Express yang juga menyajikan folder web/
  BASE_URL: "",
  // Gunakan koleksi terbaru lintas kategori sebagai daftar projects
  PROJECTS_ENDPOINT: "/api/latest",
  // Detail tidak dipakai saat ini (modal pakai data dari list)
  PROJECT_DETAIL: (id) => `/api/latest?id=${id}`,
  CONTACT_ENDPOINT: "/contact",
  HERO: {
    NAME: "Baboii",
    ROLE: "Creative Designer",
    PHOTO: "assets/profile (2).png", // ganti dengan foto kamu di path ini
    MESSAGES: ["haii"],
  },
  // Warna/gradient background untuk loader overlay
  // Contoh: "#0b1220" atau "linear-gradient(180deg,#0b1220,#030712)"
  LOADER_BG: "#000000",
  // Opsi asset loader (tempatkan file di web/assets/)
  // Contoh GIF/PNG/SVG: "assets/loader.gif". Biarkan kosong untuk spinner teks.
  LOADER_IMAGE: "assets/loader.gif",
  // Tema background loader: "space" untuk suasana langit/ruang angkasa
  LOADER_THEME: "space",
  // Teks yang ditampilkan di bawah/di samping loader
  LOADER_TEXT: "LOADING",
  SKILLS_LOGOS: [
    // Letakkan file PNG/SVG di web/assets/logos/ lalu sesuaikan path di sini.
    // Jika file tidak ada, sistem akan membuat placeholder otomatis dengan teks.
    { name: "Photoshop", src: "assets/logos/Photoshop.png" },
    { name: "CorelDraw", src: "assets/logos/CorelDRaw.png" },
    { name: "Pinterest", src: "assets/logos/pinterest.png" },
    { name: "Chatgpt", src: "assets/logos/chatgpt.png" },
    { name: "Instagram", src: "assets/logos/Instagram.png" },
  ],
  // Sosial media untuk navbar
  SOCIALS: [
    { name: "Instagram", url: "https://instagram.com/your_handle", icon: "assets/logos/Instagram.png" },
    { name: "TikTok",    url: "https://tiktok.com/@your_handle",   icon: "assets/logos/TikTok.png" },
    { name: "Pinterest", url: "https://pinterest.com/your_handle", icon: "assets/logos/pinterest.png" }
  ],
};
