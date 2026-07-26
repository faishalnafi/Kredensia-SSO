import{r as d,j as e,H as T}from"./app-D91mOm_w.js";import{T as R}from"./TataLetakUtama-DWO42aKv.js";import"./ThemeToggle-BCER9XcY.js";function C(){const[u,_]=d.useState("autentikasi"),[p,b]=d.useState({}),[j,v]=d.useState("/api/v1/test"),[m,N]=d.useState(""),[x,w]=d.useState(""),[g,f]=d.useState(!1),[c,k]=d.useState(null),[r,I]=d.useState("");d.useEffect(()=>{typeof window<"u"&&I(window.location.origin+"/api")},[]);const y=(a,s)=>{navigator.clipboard.writeText(a).then(()=>{b(l=>({...l,[s]:!0})),setTimeout(()=>{b(l=>({...l,[s]:!1}))},2e3)})},A=async a=>{a.preventDefault(),f(!0),k(null);const s={Accept:"application/json"};m&&(s["X-API-Key"]=m);const l=`${window.location.origin}${j}${x?"?"+x:""}`;try{const o=await fetch(l,{method:"GET",headers:s}),S=await o.json();k({status:`${o.status} ${o.statusText}`,body:S})}catch(o){k({status:"Error",body:{pesan:"Gagal menghubungi server. Periksa koneksi atau CORS.",detail:o.message}})}finally{f(!1)}},K=[{id:"autentikasi",label:"1. Autentikasi",ikon:"lock"},{id:"base-url",label:"2. Base URL",ikon:"link"},{id:"ep-test",label:"3. Test Koneksi",ikon:"wifi_tethering"},{id:"ep-members",label:"4. Members (Pengguna)",ikon:"group"},{id:"ep-kelas",label:"5. Kelas",ikon:"meeting_room"},{id:"ep-tahun-pelajaran",label:"6. Tahun Pelajaran",ikon:"calendar_month"},{id:"ep-peran-statistik",label:"7. Peran & Statistik",ikon:"bar_chart"},{id:"error-handling",label:"8. Error Handling",ikon:"info"},{id:"contoh-implementasi",label:"9. Contoh Implementasi",ikon:"terminal"},{id:"simulasi-api",label:"Simulasi API (Live)",ikon:"play_circle"}],P=a=>{_(a);const s=document.getElementById(a);s&&s.scrollIntoView({behavior:"smooth",block:"start"})},E=({method:a="GET"})=>{const s=a==="GET"?"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400":"bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";return e.jsx("span",{className:`font-mono text-xs font-extrabold px-2.5 py-1 rounded-md ${s}`,children:a})},t=({judul:a,kode:s,salinKey:l,warna:o="text-slate-300"})=>e.jsxs("div",{className:"space-y-2",children:[a&&e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-widest block",children:a}),e.jsxs("div",{className:"relative",children:[e.jsx("pre",{className:`bg-slate-900 ${o} font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto pr-16 leading-relaxed whitespace-pre`,children:s}),e.jsx("button",{onClick:()=>y(s,l),className:"absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all",children:p[l]?"✓":"Copy"})]})]}),h=({params:a})=>e.jsx("div",{className:"overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50",children:e.jsxs("table",{className:"w-full text-left text-xs text-slate-600 dark:text-slate-300",children:[e.jsx("thead",{className:"bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 font-bold uppercase tracking-wider",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3",children:"Parameter"}),e.jsx("th",{className:"px-4 py-3",children:"Tipe"}),e.jsx("th",{className:"px-4 py-3",children:"Default"}),e.jsx("th",{className:"px-4 py-3",children:"Keterangan"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-700/50",children:a.map((s,l)=>e.jsxs("tr",{children:[e.jsx("td",{className:"px-4 py-3 font-mono font-bold text-[#0F91FC]",children:s.name}),e.jsx("td",{className:"px-4 py-3",children:s.tipe}),e.jsx("td",{className:"px-4 py-3 text-slate-400",children:s.default||"—"}),e.jsx("td",{className:"px-4 py-3 text-slate-500 dark:text-slate-400",children:s.ket})]},l))})]})}),i=({nomor:a,judul:s})=>e.jsxs("div",{className:"flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm shrink-0",children:a}),e.jsx("h2",{className:"text-xl font-bold text-slate-800 dark:text-white",children:s})]}),n=({method:a,path:s,deskripsi:l})=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx(E,{method:a}),e.jsx("code",{className:"font-mono text-sm font-bold text-slate-700 dark:text-slate-200",children:s})]}),e.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400 leading-relaxed",children:l})]});return e.jsxs(e.Fragment,{children:[e.jsx(T,{title:"Dokumentasi API - Kredensia SSO"}),e.jsxs("div",{className:"w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6",children:[e.jsx("div",{className:"lg:col-span-1",children:e.jsxs("div",{className:"sticky top-6 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto",children:[e.jsx("h3",{className:"text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3",children:"Daftar Isi"}),e.jsx("nav",{className:"space-y-1",children:K.map(a=>e.jsxs("button",{onClick:()=>P(a.id),className:`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${u===a.id?"bg-[#0F91FC]/10 text-[#0F91FC] dark:bg-[#0F91FC]/20 dark:text-sky-400":"text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30"}`,children:[e.jsx("span",{className:"material-symbols-rounded text-lg shrink-0",children:a.ikon}),e.jsx("span",{className:"truncate text-xs",children:a.label})]},a.id))})]})}),e.jsxs("div",{className:"lg:col-span-3 space-y-8 pb-20",children:[e.jsxs("section",{id:"autentikasi",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"1",judul:"Autentikasi"}),e.jsxs("p",{className:"text-sm text-slate-600 dark:text-slate-300 leading-relaxed",children:["Seluruh endpoint API dilindungi oleh ",e.jsx("strong",{children:"API Key"})," yang dikirimkan melalui HTTP header. Kunci API diperoleh dari halaman ",e.jsx("strong",{children:"Kunci API"})," pada panel admin."]}),e.jsx("div",{className:"overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50",children:e.jsxs("table",{className:"w-full text-left text-sm text-slate-600 dark:text-slate-300",children:[e.jsx("thead",{className:"text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3",children:"Header"}),e.jsx("th",{className:"px-6 py-3",children:"Tipe"}),e.jsx("th",{className:"px-6 py-3",children:"Keterangan"})]})}),e.jsxs("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-700/50",children:[e.jsxs("tr",{children:[e.jsx("td",{className:"px-6 py-4 font-mono font-bold text-xs text-[#0F91FC]",children:"X-API-Key"}),e.jsx("td",{className:"px-6 py-4 text-xs font-semibold",children:"string"}),e.jsx("td",{className:"px-6 py-4 text-xs text-red-500 dark:text-red-400 font-bold",children:"Wajib. API Key dari panel manajemen kunci."})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"px-6 py-4 font-mono text-xs text-slate-400",children:"Authorization"}),e.jsx("td",{className:"px-6 py-4 text-xs font-semibold text-slate-400",children:"string"}),e.jsxs("td",{className:"px-6 py-4 text-xs text-slate-400",children:["Alternatif — format ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"Bearer <token>"}),"."]})]})]})]})}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-700 dark:text-slate-200",children:"Verifikasi Domain"}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 leading-relaxed",children:["Selain validasi kunci API, sistem memverifikasi ",e.jsx("strong",{children:"domain pengirim"})," dari header ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"Origin"})," atau ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"Referer"}),". Domain harus sesuai dengan domain terdaftar di kunci API."]}),e.jsxs("div",{className:"p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5",children:[e.jsx("span",{className:"material-symbols-rounded text-lg text-amber-500 shrink-0 mt-0.5",children:"lightbulb"}),e.jsxs("span",{children:[e.jsx("b",{children:"Tips Development:"})," Gunakan domain wildcard ",e.jsx("code",{className:"bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono font-bold",children:"*"})," saat generate kunci API untuk menonaktifkan verifikasi domain di lingkungan lokal/staging."]})]})]})]}),e.jsxs("section",{id:"base-url",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"2",judul:"Base URL"}),e.jsx("p",{className:"text-sm text-slate-600 dark:text-slate-300 leading-relaxed",children:"Seluruh endpoint API berada di bawah base URL versi 1 berikut:"}),e.jsxs("div",{className:"relative",children:[e.jsxs("pre",{className:"bg-slate-900 text-sky-400 font-mono text-sm px-5 py-4 rounded-2xl border border-slate-700 pr-20 select-all overflow-x-auto",children:[r,"/v1"]}),e.jsx("button",{onClick:()=>y(`${r}/v1`,"baseurl"),className:`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${p.baseurl?"bg-emerald-500 text-white":"bg-slate-800 hover:bg-slate-700 text-slate-300"}`,children:p.baseurl?"Disalin ✓":"Salin"})]})]}),e.jsxs("section",{id:"ep-test",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"3",judul:"Test Koneksi"}),e.jsx(n,{method:"GET",path:"/api/v1/test",deskripsi:"Endpoint health-check untuk memverifikasi bahwa API key valid, domain dikenali, dan server berjalan normal."}),e.jsx(t,{judul:"Contoh Request (cURL)",salinKey:"curl-test",kode:`curl -X GET "${r}/v1/test" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-test",kode:`{
  "success": true,
  "data": {
    "status": "ok",
    "server_time": "2026-07-20T23:05:00+07:00"
  },
  "meta": {
    "app_name": "CBT Exam System",
    "request_domain": "cbt.sekolah.sch.id",
    "request_domain_source": "origin",
    "origin": "https://cbt.sekolah.sch.id",
    "referer": null,
    "ip": "203.0.113.10"
  }
}`})]}),e.jsxs("section",{id:"ep-members",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"4",judul:"Members (Pengguna)"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(n,{method:"GET",path:"/api/v1/members",deskripsi:"Mengambil daftar seluruh pengguna SSO beserta data kelas dan tahun pelajaran mereka. Mendukung filter dan paginasi."}),e.jsx(h,{params:[{name:"search",tipe:"string",default:"—",ket:"Cari berdasarkan nama, NIK, NISN/NIP, atau email."},{name:"email",tipe:"string",default:"—",ket:"Filter tepat berdasarkan alamat email."},{name:"role",tipe:"string",default:"—",ket:"Filter berdasarkan nama peran (contoh: siswa, guru, tendik, alumni)."},{name:"kelas_id",tipe:"uuid",default:"—",ket:"Filter pengguna berdasarkan UUID kelas tertentu."},{name:"is_active",tipe:"boolean",default:"—",ket:"Filter pengguna aktif (true) atau nonaktif (false)."},{name:"page",tipe:"integer",default:"1",ket:"Nomor halaman untuk paginasi."},{name:"per_page",tipe:"integer",default:"50",ket:"Jumlah data per halaman (maksimal 100)."}]}),e.jsx(t,{judul:"Contoh Request — daftar siswa kelas tertentu",salinKey:"curl-members",kode:`curl -X GET "${r}/v1/members?role=siswa&kelas_id=UUID_KELAS&per_page=30" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-members",kode:`{
  "success": true,
  "data": [
    {
      "id": "019f8046-2784-7043-80ff-c70115d4ada1",
      "nama_lengkap": "Nafi' Mukhtar",
      "email": "nafi@kredensia.id",
      "nik": "3515012345670001",
      "nip_nis": "12345678",
      "jk": "L",
      "no_telp": "081234567890",
      "tgl_lahir": "2008-05-12",
      "is_active": true,
      "claimed_at": "2026-07-11T12:00:00.000000Z",
      "created_at": "2026-07-11T10:00:00.000000Z",
      "updated_at": "2026-07-20T15:30:00.000000Z",
      "kelas_id": "01938abc-0000-7000-a000-000000000001",
      "roles": [{ "id": "uuid-role", "nama_role": "Siswa" }],
      "kelas": {
        "id": "01938abc-0000-7000-a000-000000000001",
        "nama_kelas": "XII IPA 1",
        "tingkat": "XII",
        "jurusan": "IPA",
        "tahun_pelajaran": {
          "id": "tp-uuid-001",
          "tahun_mulai": 2026,
          "tahun_selesai": 2027,
          "semester": "Ganjil",
          "is_aktif": true
        }
      }
    }
  ],
  "meta": { "total": 1, "page": 1, "per_page": 30, "last_page": 1 }
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(n,{method:"GET",path:"/api/v1/members/{id}",deskripsi:"Mengambil detail lengkap satu pengguna berdasarkan UUID-nya, termasuk relasi kelas dan tahun pelajaran."}),e.jsx(t,{judul:"Contoh Request",salinKey:"curl-member-detail",kode:`curl -X GET "${r}/v1/members/019f8046-2784-7043-80ff-c70115d4ada1" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (404 Not Found)",salinKey:"res-member-404",kode:`{
  "success": false,
  "pesan": "Member tidak ditemukan."
}`})]})]}),e.jsxs("section",{id:"ep-kelas",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"5",judul:"Kelas"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(n,{method:"GET",path:"/api/v1/kelas",deskripsi:"Mengambil daftar semua kelas beserta info tahun pelajaran, wali kelas, dan jumlah siswa."}),e.jsx(h,{params:[{name:"tahun_pelajaran_id",tipe:"uuid",default:"—",ket:"Filter kelas berdasarkan UUID tahun pelajaran."},{name:"tingkat",tipe:"string",default:"—",ket:"Filter berdasarkan tingkat kelas (contoh: X, XI, XII)."},{name:"aktif",tipe:"boolean",default:"false",ket:"Jika true, hanya menampilkan kelas pada tahun pelajaran yang aktif."}]}),e.jsx(t,{judul:"Contoh Request — hanya kelas aktif tingkat XII",salinKey:"curl-kelas",kode:`curl -X GET "${r}/v1/kelas?aktif=true&tingkat=XII" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-kelas",kode:`{
  "success": true,
  "data": [
    {
      "id": "01938abc-0000-7000-a000-000000000001",
      "nama_kelas": "XII IPA 1",
      "tingkat": "XII",
      "jurusan": "IPA",
      "tahun_pelajaran_id": "tp-uuid-001",
      "wali_kelas_id": "guru-uuid-001",
      "created_at": "2026-07-01T00:00:00.000000Z",
      "jumlah_siswa": 36,
      "tahun_pelajaran": {
        "id": "tp-uuid-001",
        "tahun_mulai": 2026,
        "tahun_selesai": 2027,
        "semester": "Ganjil",
        "is_aktif": true
      },
      "wali_kelas": {
        "id": "guru-uuid-001",
        "nama_lengkap": "Aulia Zahra, S.Pd",
        "nip_nis": "197501012000121001"
      }
    }
  ],
  "meta": { "total": 1 }
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(n,{method:"GET",path:"/api/v1/kelas/{id}",deskripsi:"Detail satu kelas beserta daftar lengkap seluruh siswa yang terdaftar di dalamnya."}),e.jsx(t,{judul:"Contoh Request",salinKey:"curl-kelas-detail",kode:`curl -X GET "${r}/v1/kelas/01938abc-0000-7000-a000-000000000001" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-kelas-detail",kode:`{
  "success": true,
  "data": {
    "id": "01938abc-0000-7000-a000-000000000001",
    "nama_kelas": "XII IPA 1",
    "tingkat": "XII",
    "jurusan": "IPA",
    "jumlah_siswa": 2,
    "tahun_pelajaran": { "semester": "Ganjil", "is_aktif": true, ... },
    "wali_kelas": { "nama_lengkap": "Aulia Zahra, S.Pd", ... },
    "siswa": [
      {
        "id": "uuid-siswa-1",
        "nama_lengkap": "Ahmad Fauzi",
        "nip_nis": "12345",
        "jk": "L",
        "is_active": true,
        "roles": [{ "nama_role": "Siswa" }]
      }
    ]
  }
}`})]})]}),e.jsxs("section",{id:"ep-tahun-pelajaran",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"6",judul:"Tahun Pelajaran"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(n,{method:"GET",path:"/api/v1/tahun-pelajaran",deskripsi:"Mengambil seluruh tahun pelajaran yang tersedia beserta jumlah kelas di masing-masing tahun pelajaran."}),e.jsx(h,{params:[{name:"is_aktif",tipe:"boolean",default:"—",ket:"Jika true, hanya mengembalikan tahun pelajaran yang sedang aktif."}]}),e.jsx(t,{judul:"Contoh Request — ambil TP aktif saat ini",salinKey:"curl-tp",kode:`curl -X GET "${r}/v1/tahun-pelajaran?is_aktif=true" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-tp",kode:`{
  "success": true,
  "data": [
    {
      "id": "tp-uuid-001",
      "tahun_mulai": 2026,
      "tahun_selesai": 2027,
      "semester": "Ganjil",
      "is_aktif": true,
      "created_at": "2026-07-01T00:00:00.000000Z",
      "kelas_count": 12,
      "label": "2026/2027 - Ganjil"
    }
  ],
  "meta": { "total": 1 }
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(n,{method:"GET",path:"/api/v1/tahun-pelajaran/{id}",deskripsi:"Detail satu tahun pelajaran beserta seluruh kelas yang dimilikinya termasuk wali kelas tiap kelas."}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-tp-detail",kode:`{
  "success": true,
  "data": {
    "id": "tp-uuid-001",
    "tahun_mulai": 2026,
    "tahun_selesai": 2027,
    "semester": "Ganjil",
    "is_aktif": true,
    "label": "2026/2027 - Ganjil",
    "kelas": [
      {
        "id": "kelas-uuid-1",
        "nama_kelas": "XII IPA 1",
        "tingkat": "XII",
        "jurusan": "IPA",
        "wali_kelas": { "nama_lengkap": "Aulia Zahra, S.Pd", ... }
      }
    ]
  }
}`})]})]}),e.jsxs("section",{id:"ep-peran-statistik",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"7",judul:"Peran & Statistik"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(n,{method:"GET",path:"/api/v1/data/peran",deskripsi:"Mengembalikan seluruh peran/role yang terdaftar di sistem beserta jumlah pengguna per peran."}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-peran",kode:`{
  "success": true,
  "data": [
    { "id": "uuid-role", "nama_role": "Siswa", "is_active": true, "users_count": 452 },
    { "id": "uuid-role", "nama_role": "Guru",  "is_active": true, "users_count": 34 }
  ]
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(n,{method:"GET",path:"/api/v1/data/statistik",deskripsi:"Ringkasan statistik keseluruhan data di sistem SSO: pengguna, kelas, dan tahun pelajaran."}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-statistik",kode:`{
  "success": true,
  "data": {
    "total_pengguna": 520,
    "total_pengguna_aktif": 498,
    "total_pengguna_terklaim": 412,
    "total_peran": 6,
    "total_kelas": 12,
    "total_tahun_pelajaran": 3,
    "tahun_pelajaran_aktif": "tp-uuid-001"
  }
}`})]})]}),e.jsxs("section",{id:"error-handling",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"8",judul:"Error Handling"}),e.jsxs("p",{className:"text-sm text-slate-600 dark:text-slate-300 leading-relaxed",children:["Semua response error mengikuti format JSON standar dengan field ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"success: false"})," dan ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"pesan"}),"."]}),e.jsx("div",{className:"space-y-5",children:[{kode:"401",warna:"red",judul:"Unauthorized",deskripsi:"Header X-API-Key tidak disertakan, format tidak valid, atau kunci tidak ditemukan di database."},{kode:"403",warna:"orange",judul:"Forbidden",deskripsi:"Domain pengirim (dari header Origin/Referer) tidak cocok dengan domain terdaftar di kunci API, atau kunci API dinonaktifkan."},{kode:"404",warna:"red",judul:"Not Found",deskripsi:"Resource yang diminta (detail member, kelas, atau tahun pelajaran berdasarkan UUID) tidak ditemukan."},{kode:"500",warna:"red",judul:"Internal Server Error",deskripsi:"Terjadi kesalahan tak terduga di sisi server. Laporkan ke administrator jika terjadi berulang kali."}].map(({kode:a,judul:s,deskripsi:l})=>e.jsxs("div",{className:"flex gap-4 items-start",children:[e.jsx("span",{className:"bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2 py-1 rounded text-xs min-w-[3rem] text-center font-mono",children:a}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-700 dark:text-slate-200",children:s}),e.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400",children:l})]})]},a))}),e.jsx(t,{judul:"Format Error Response",salinKey:"res-error",kode:`// 401 Unauthorized
{ "success": false, "pesan": "API key tidak valid atau tidak ditemukan." }

// 403 Forbidden
{ "success": false, "pesan": "Domain tidak diizinkan untuk menggunakan kunci ini." }

// 404 Not Found
{ "success": false, "pesan": "Member tidak ditemukan." }`})]}),e.jsxs("section",{id:"contoh-implementasi",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"9",judul:"Contoh Implementasi"}),e.jsx(t,{judul:"PHP (cURL) — Ambil siswa kelas aktif",salinKey:"impl-php",warna:"text-emerald-400",kode:`<?php

$apiKey  = 'YOUR_API_KEY_HERE';
$baseUrl = '${r}/v1';

// 1. Ambil tahun pelajaran aktif
$tpRes  = json_decode(file_get_contents($baseUrl . '/tahun-pelajaran?is_aktif=true', false, stream_context_create([
    'http' => ['header' => "X-API-Key: $apiKey\\r\\nAccept: application/json\\r\\n"]
])), true);
$tpId = $tpRes['data'][0]['id'] ?? null;

// 2. Ambil seluruh kelas pada tahun pelajaran aktif
$kelasRes = json_decode(file_get_contents($baseUrl . '/kelas?aktif=true', false, stream_context_create([
    'http' => ['header' => "X-API-Key: $apiKey\\r\\nAccept: application/json\\r\\n"]
])), true);

foreach ($kelasRes['data'] as $kelas) {
    echo $kelas['nama_kelas'] . ' — ' . $kelas['jumlah_siswa'] . ' siswa\\n';
}`}),e.jsx(t,{judul:"JavaScript (Fetch API) — Sinkronisasi pengguna SSO ke aplikasi lain",salinKey:"impl-js",warna:"text-sky-400",kode:`const API_KEY = 'YOUR_API_KEY_HERE';
const BASE    = '${r}/v1';

async function ambilSiswaDariKelas(kelasId) {
    const res = await fetch(\`\${BASE}/members?kelas_id=\${kelasId}&role=siswa\`, {
        headers: { 'X-API-Key': API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const { data, meta } = await res.json();
    console.log(\`Total siswa: \${meta.total}\`, data);
    return data;
}

// Jalankan
ambilSiswaDariKelas('UUID_KELAS_ANDA');`})]}),e.jsxs("section",{id:"simulasi-api",className:"bg-gradient-to-br from-[#081242] to-[#030947] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-900/10 space-y-6",children:[e.jsxs("div",{className:"border-b border-white/10 pb-4",children:[e.jsxs("h2",{className:"text-xl font-bold flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-sky-400",children:"play_circle"}),"Simulasi API Terintegrasi"]}),e.jsx("p",{className:"text-xs text-slate-300 mt-1",children:"Tes endpoint secara langsung dari browser menggunakan kunci API Anda."})]}),e.jsxs("form",{onSubmit:A,className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5",children:"API Key Anda"}),e.jsx("input",{type:"text",value:m,onChange:a=>N(a.target.value),placeholder:"Ketik atau tempel kunci API Anda",className:"w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5",children:"Endpoint"}),e.jsxs("select",{value:j,onChange:a=>v(a.target.value),className:"w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC]",children:[e.jsx("option",{value:"/api/v1/test",children:"GET /api/v1/test — Test Koneksi"}),e.jsx("option",{value:"/api/v1/members",children:"GET /api/v1/members — Daftar Pengguna"}),e.jsx("option",{value:"/api/v1/kelas",children:"GET /api/v1/kelas — Daftar Kelas"}),e.jsx("option",{value:"/api/v1/tahun-pelajaran",children:"GET /api/v1/tahun-pelajaran — Tahun Pelajaran"}),e.jsx("option",{value:"/api/v1/data/peran",children:"GET /api/v1/data/peran — Daftar Peran"}),e.jsx("option",{value:"/api/v1/data/statistik",children:"GET /api/v1/data/statistik — Statistik Sistem"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5",children:["Query Params ",e.jsx("span",{className:"text-slate-400 font-normal",children:"(Opsional)"})]}),e.jsx("input",{type:"text",value:x,onChange:a=>w(a.target.value),placeholder:"Contoh: role=siswa&aktif=true&per_page=5",className:"w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"})]}),e.jsxs("button",{type:"submit",disabled:g,className:"w-full py-2.5 bg-[#0F91FC] hover:bg-[#0a78d6] disabled:opacity-50 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#0F91FC]/20 flex items-center justify-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-sm",children:"send"}),g?"Mengirim...":"Kirim Request"]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("span",{className:"text-xs font-bold text-slate-300 uppercase tracking-widest block",children:"Response Output"}),e.jsx("div",{className:"bg-slate-950/60 rounded-2xl border border-white/10 p-4 min-h-[220px] max-h-[340px] overflow-y-auto font-mono text-xs",children:c?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 block",children:"// Status Code"}),e.jsx("span",{className:c.status.startsWith("200")?"text-emerald-400 font-bold":"text-rose-400 font-bold",children:c.status})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 block",children:"// Response Body"}),e.jsx("pre",{className:"text-emerald-400 overflow-x-auto whitespace-pre-wrap",children:JSON.stringify(c.body,null,2)})]})]}):e.jsx("span",{className:"text-slate-500 italic block mt-16 text-center",children:"Response akan muncul di sini setelah Anda mengklik Kirim Request."})})]})]})]})]})]})]})}C.layout=u=>e.jsx(R,{children:u,title:"Dokumentasi API & Integrasi SSO"});export{C as default};
