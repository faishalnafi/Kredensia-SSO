import{r as n,j as e,H as D}from"./app-BhvF60H2.js";import{T as R}from"./TataLetakUtama-wysYibjG.js";import"./ThemeToggle-Boor_Cd_.js";import"./sweetalert2.esm.all-DE6NlnlT.js";function G(){const[u,w]=n.useState("autentikasi"),[x,j]=n.useState({}),[g,v]=n.useState("/api/v1/test"),[p,_]=n.useState(""),[k,S]=n.useState(""),[f,y]=n.useState(!1),[m,h]=n.useState(null),[r,P]=n.useState(""),[c,I]=n.useState("php");n.useEffect(()=>{typeof window<"u"&&P(window.location.origin+"/api")},[]);const N=(a,s)=>{navigator.clipboard.writeText(a).then(()=>{j(l=>({...l,[s]:!0})),setTimeout(()=>{j(l=>({...l,[s]:!1}))},2e3)})},K=async a=>{a.preventDefault(),y(!0),h(null);const s={Accept:"application/json"};p&&(s["X-API-Key"]=p);const l=`${window.location.origin}${g}${k?"?"+k:""}`;try{const o=await fetch(l,{method:"GET",headers:s}),E=await o.json();h({status:`${o.status} ${o.statusText}`,body:E})}catch(o){h({status:"Error",body:{pesan:"Gagal menghubungi server. Periksa koneksi atau CORS.",detail:o.message}})}finally{y(!1)}},A=[{id:"autentikasi",label:"1. Autentikasi",ikon:"lock"},{id:"base-url",label:"2. Base URL",ikon:"link"},{id:"ep-test",label:"3. Test Koneksi",ikon:"wifi_tethering"},{id:"ep-members",label:"4. Members (Pengguna)",ikon:"group"},{id:"ep-kelas",label:"5. Kelas",ikon:"meeting_room"},{id:"ep-tahun-pelajaran",label:"6. Tahun Pelajaran",ikon:"calendar_month"},{id:"ep-peran-statistik",label:"7. Peran & Statistik",ikon:"bar_chart"},{id:"error-handling",label:"8. Error Handling",ikon:"info"},{id:"contoh-implementasi",label:"9. Official Client SDK (PHP, Node, Python, Go)",ikon:"terminal"},{id:"simulasi-api",label:"Simulasi API (Live)",ikon:"play_circle"}],C=a=>{w(a);const s=document.getElementById(a);s&&s.scrollIntoView({behavior:"smooth",block:"start"})},T=({method:a="GET"})=>{const s=a==="GET"?"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400":"bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";return e.jsx("span",{className:`font-mono text-xs font-extrabold px-2.5 py-1 rounded-md ${s}`,children:a})},t=({judul:a,kode:s,salinKey:l,warna:o="text-slate-300"})=>e.jsxs("div",{className:"space-y-2",children:[a&&e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-widest block",children:a}),e.jsxs("div",{className:"relative",children:[e.jsx("pre",{className:`bg-slate-900 ${o} font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto pr-16 leading-relaxed whitespace-pre`,children:s}),e.jsx("button",{onClick:()=>N(s,l),className:"absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all",children:x[l]?"✓":"Copy"})]})]}),b=({params:a})=>e.jsx("div",{className:"overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50",children:e.jsxs("table",{className:"w-full text-left text-xs text-slate-600 dark:text-slate-300",children:[e.jsx("thead",{className:"bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 font-bold uppercase tracking-wider",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3",children:"Parameter"}),e.jsx("th",{className:"px-4 py-3",children:"Tipe"}),e.jsx("th",{className:"px-4 py-3",children:"Default"}),e.jsx("th",{className:"px-4 py-3",children:"Keterangan"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-700/50",children:a.map((s,l)=>e.jsxs("tr",{children:[e.jsx("td",{className:"px-4 py-3 font-mono font-bold text-[#0F91FC]",children:s.name}),e.jsx("td",{className:"px-4 py-3",children:s.tipe}),e.jsx("td",{className:"px-4 py-3 text-slate-400",children:s.default||"—"}),e.jsx("td",{className:"px-4 py-3 text-slate-500 dark:text-slate-400",children:s.ket})]},l))})]})}),i=({nomor:a,judul:s})=>e.jsxs("div",{className:"flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm shrink-0",children:a}),e.jsx("h2",{className:"text-xl font-bold text-slate-800 dark:text-white",children:s})]}),d=({method:a,path:s,deskripsi:l})=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx(T,{method:a}),e.jsx("code",{className:"font-mono text-sm font-bold text-slate-700 dark:text-slate-200",children:s})]}),e.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400 leading-relaxed",children:l})]});return e.jsxs(e.Fragment,{children:[e.jsx(D,{title:"Dokumentasi API - Kredensia SSO"}),e.jsxs("div",{className:"w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6",children:[e.jsx("div",{className:"lg:col-span-1",children:e.jsxs("div",{className:"sticky top-6 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto",children:[e.jsx("h3",{className:"text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3",children:"Daftar Isi"}),e.jsx("nav",{className:"space-y-1",children:A.map(a=>e.jsxs("button",{onClick:()=>C(a.id),className:`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${u===a.id?"bg-[#0F91FC]/10 text-[#0F91FC] dark:bg-[#0F91FC]/20 dark:text-sky-400":"text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30"}`,children:[e.jsx("span",{className:"material-symbols-rounded text-lg shrink-0",children:a.ikon}),e.jsx("span",{className:"truncate text-xs",children:a.label})]},a.id))})]})}),e.jsxs("div",{className:"lg:col-span-3 space-y-8 pb-20",children:[e.jsxs("section",{id:"autentikasi",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"1",judul:"Autentikasi"}),e.jsxs("p",{className:"text-sm text-slate-600 dark:text-slate-300 leading-relaxed",children:["Seluruh endpoint API dilindungi oleh ",e.jsx("strong",{children:"API Key"})," yang dikirimkan melalui HTTP header. Kunci API diperoleh dari halaman ",e.jsx("strong",{children:"Kunci API"})," pada panel admin."]}),e.jsx("div",{className:"overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50",children:e.jsxs("table",{className:"w-full text-left text-sm text-slate-600 dark:text-slate-300",children:[e.jsx("thead",{className:"text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3",children:"Header"}),e.jsx("th",{className:"px-6 py-3",children:"Tipe"}),e.jsx("th",{className:"px-6 py-3",children:"Keterangan"})]})}),e.jsxs("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-700/50",children:[e.jsxs("tr",{children:[e.jsx("td",{className:"px-6 py-4 font-mono font-bold text-xs text-[#0F91FC]",children:"X-API-Key"}),e.jsx("td",{className:"px-6 py-4 text-xs font-semibold",children:"string"}),e.jsx("td",{className:"px-6 py-4 text-xs text-red-500 dark:text-red-400 font-bold",children:"Wajib. API Key dari panel manajemen kunci."})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"px-6 py-4 font-mono text-xs text-slate-400",children:"Authorization"}),e.jsx("td",{className:"px-6 py-4 text-xs font-semibold text-slate-400",children:"string"}),e.jsxs("td",{className:"px-6 py-4 text-xs text-slate-400",children:["Alternatif — format ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"Bearer <token>"}),"."]})]})]})]})}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-700 dark:text-slate-200",children:"Verifikasi Domain"}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 leading-relaxed",children:["Selain validasi kunci API, sistem memverifikasi ",e.jsx("strong",{children:"domain pengirim"})," dari header ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"Origin"})," atau ",e.jsx("code",{className:"bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono",children:"Referer"}),". Domain harus sesuai dengan domain terdaftar di kunci API."]}),e.jsxs("div",{className:"p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5",children:[e.jsx("span",{className:"material-symbols-rounded text-lg text-amber-500 shrink-0 mt-0.5",children:"lightbulb"}),e.jsxs("span",{children:[e.jsx("b",{children:"Tips Development:"})," Gunakan domain wildcard ",e.jsx("code",{className:"bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono font-bold",children:"*"})," saat generate kunci API untuk menonaktifkan verifikasi domain di lingkungan lokal/staging."]})]})]})]}),e.jsxs("section",{id:"base-url",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"2",judul:"Base URL"}),e.jsx("p",{className:"text-sm text-slate-600 dark:text-slate-300 leading-relaxed",children:"Seluruh endpoint API berada di bawah base URL versi 1 berikut:"}),e.jsxs("div",{className:"relative",children:[e.jsxs("pre",{className:"bg-slate-900 text-sky-400 font-mono text-sm px-5 py-4 rounded-2xl border border-slate-700 pr-20 select-all overflow-x-auto",children:[r,"/v1"]}),e.jsx("button",{onClick:()=>N(`${r}/v1`,"baseurl"),className:`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${x.baseurl?"bg-emerald-500 text-white":"bg-slate-800 hover:bg-slate-700 text-slate-300"}`,children:x.baseurl?"Disalin ✓":"Salin"})]})]}),e.jsxs("section",{id:"ep-test",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsx(i,{nomor:"3",judul:"Test Koneksi"}),e.jsx(d,{method:"GET",path:"/api/v1/test",deskripsi:"Endpoint health-check untuk memverifikasi bahwa API key valid, domain dikenali, dan server berjalan normal."}),e.jsx(t,{judul:"Contoh Request (cURL)",salinKey:"curl-test",kode:`curl -X GET "${r}/v1/test" \\
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
}`})]}),e.jsxs("section",{id:"ep-members",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"4",judul:"Members (Pengguna)"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(d,{method:"GET",path:"/api/v1/members",deskripsi:"Mengambil daftar seluruh pengguna SSO beserta data kelas dan tahun pelajaran mereka. Mendukung filter dan paginasi."}),e.jsx(b,{params:[{name:"search",tipe:"string",default:"—",ket:"Cari berdasarkan nama, NIK, NISN (Siswa) / NIP (Guru), atau email."},{name:"email",tipe:"string",default:"—",ket:"Filter tepat berdasarkan alamat email."},{name:"role",tipe:"string",default:"—",ket:"Filter berdasarkan nama peran (contoh: siswa, guru, tendik, alumni)."},{name:"kelas_id",tipe:"uuid",default:"—",ket:"Filter pengguna berdasarkan UUID kelas tertentu."},{name:"is_active",tipe:"boolean",default:"—",ket:"Filter pengguna aktif (true) atau nonaktif (false)."},{name:"page",tipe:"integer",default:"1",ket:"Nomor halaman untuk paginasi."},{name:"per_page",tipe:"integer",default:"50",ket:"Jumlah data per halaman (maksimal 100)."}]}),e.jsx(t,{judul:"Contoh Request — daftar siswa kelas tertentu",salinKey:"curl-members",kode:`curl -X GET "${r}/v1/members?role=siswa&kelas_id=UUID_KELAS&per_page=30" \\
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
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(d,{method:"GET",path:"/api/v1/members/{id}",deskripsi:"Mengambil detail lengkap satu pengguna berdasarkan UUID-nya, termasuk relasi kelas dan tahun pelajaran."}),e.jsx(t,{judul:"Contoh Request",salinKey:"curl-member-detail",kode:`curl -X GET "${r}/v1/members/019f8046-2784-7043-80ff-c70115d4ada1" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}),e.jsx(t,{judul:"Contoh Response (404 Not Found)",salinKey:"res-member-404",kode:`{
  "success": false,
  "pesan": "Member tidak ditemukan."
}`})]})]}),e.jsxs("section",{id:"ep-kelas",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"5",judul:"Kelas"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(d,{method:"GET",path:"/api/v1/kelas",deskripsi:"Mengambil daftar semua kelas beserta info tahun pelajaran, wali kelas, dan jumlah siswa."}),e.jsx(b,{params:[{name:"tahun_pelajaran_id",tipe:"uuid",default:"—",ket:"Filter kelas berdasarkan UUID tahun pelajaran."},{name:"tingkat",tipe:"string",default:"—",ket:"Filter berdasarkan tingkat kelas (contoh: X, XI, XII)."},{name:"aktif",tipe:"boolean",default:"false",ket:"Jika true, hanya menampilkan kelas pada tahun pelajaran yang aktif."}]}),e.jsx(t,{judul:"Contoh Request — hanya kelas aktif tingkat XII",salinKey:"curl-kelas",kode:`curl -X GET "${r}/v1/kelas?aktif=true&tingkat=XII" \\
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
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(d,{method:"GET",path:"/api/v1/kelas/{id}",deskripsi:"Detail satu kelas beserta daftar lengkap seluruh siswa yang terdaftar di dalamnya."}),e.jsx(t,{judul:"Contoh Request",salinKey:"curl-kelas-detail",kode:`curl -X GET "${r}/v1/kelas/01938abc-0000-7000-a000-000000000001" \\
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
}`})]})]}),e.jsxs("section",{id:"ep-tahun-pelajaran",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"6",judul:"Tahun Pelajaran"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(d,{method:"GET",path:"/api/v1/tahun-pelajaran",deskripsi:"Mengambil seluruh tahun pelajaran yang tersedia beserta jumlah kelas di masing-masing tahun pelajaran."}),e.jsx(b,{params:[{name:"is_aktif",tipe:"boolean",default:"—",ket:"Jika true, hanya mengembalikan tahun pelajaran yang sedang aktif."}]}),e.jsx(t,{judul:"Contoh Request — ambil TP aktif saat ini",salinKey:"curl-tp",kode:`curl -X GET "${r}/v1/tahun-pelajaran?is_aktif=true" \\
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
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(d,{method:"GET",path:"/api/v1/tahun-pelajaran/{id}",deskripsi:"Detail satu tahun pelajaran beserta seluruh kelas yang dimilikinya termasuk wali kelas tiap kelas."}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-tp-detail",kode:`{
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
}`})]})]}),e.jsxs("section",{id:"ep-peran-statistik",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8",children:[e.jsx(i,{nomor:"7",judul:"Peran & Statistik"}),e.jsxs("div",{className:"space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8",children:[e.jsx(d,{method:"GET",path:"/api/v1/data/peran",deskripsi:"Mengembalikan seluruh peran/role yang terdaftar di sistem beserta jumlah pengguna per peran."}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-peran",kode:`{
  "success": true,
  "data": [
    { "id": "uuid-role", "nama_role": "Siswa", "is_active": true, "users_count": 452 },
    { "id": "uuid-role", "nama_role": "Guru",  "is_active": true, "users_count": 34 }
  ]
}`})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(d,{method:"GET",path:"/api/v1/data/statistik",deskripsi:"Ringkasan statistik keseluruhan data di sistem SSO: pengguna, kelas, dan tahun pelajaran."}),e.jsx(t,{judul:"Contoh Response (200 OK)",salinKey:"res-statistik",kode:`{
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
{ "success": false, "pesan": "Member tidak ditemukan." }`})]}),e.jsxs("section",{id:"contoh-implementasi",className:"bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4",children:[e.jsx(i,{nomor:"9",judul:"Official Client SDK & Contoh Kode"}),e.jsx("span",{className:"text-xs text-slate-400 font-mono",children:"PHP • Node.js • Python • Go"})]}),e.jsx("div",{className:"flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60",children:[{id:"php",label:"PHP SDK",ikon:"data_object",file:"SsoSekolahClient.php",url:"/sdk/SsoSekolahClient.php"},{id:"nodejs",label:"Node.js / TS",ikon:"javascript",file:"SsoSekolahClient.js",url:"/sdk/SsoSekolahClient.js"},{id:"python",label:"Python 3",ikon:"terminal",file:"sso_sekolah_client.py",url:"/sdk/sso_sekolah_client.py"},{id:"go",label:"Go (Golang)",ikon:"code",file:"ssoclient.go",url:"/sdk/ssoclient.go"}].map(a=>e.jsxs("button",{type:"button",onClick:()=>I(a.id),className:`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${c===a.id?"bg-white dark:bg-slate-800 text-[#0F91FC] shadow-md border border-slate-200/80 dark:border-slate-700":"text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:a.ikon}),e.jsx("span",{children:a.label})]},a.id))}),c==="php"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50",children:[e.jsxs("div",{children:[e.jsxs("h4",{className:"text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"File SDK: SsoSekolahClient.php (PHP 7.4 / 8.x)"]}),e.jsx("p",{className:"text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5",children:"Strict OOP Client Class dengan cURL native, error handling otomatis, dan verifikator JWT Token."})]}),e.jsxs("a",{href:"/sdk/SsoSekolahClient.php",download:!0,className:"px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"Download SDK (.php)"]})]}),e.jsx(t,{judul:"Cara Penggunaan (PHP SDK)",salinKey:"sdk-php",warna:"text-indigo-300",kode:`<?php

require_once __DIR__ . '/SsoSekolahClient.php';
use SsoSekolah\\SsoSekolahClient;

$client = new SsoSekolahClient('${r}', 'KUNCI_API_ANDA');

try {
    // 1. Uji koneksi API Key
    $tes = $client->testConnection();
    echo "Status: " . $tes['pesan'] . "\\n";

    // 2. Ambil daftar siswa aktif
    $siswa = $client->getMembers(['role' => 'siswa', 'per_page' => 10]);
    echo "Total Siswa: " . $siswa['meta']['total'] . "\\n";

    // 3. Dekode & Verifikasi Token JWT SSO
    $payload = SsoSekolahClient::verifyJwtToken($_GET['token'] ?? '');
    if ($payload) {
        echo "Login Sebagai: " . $payload['name'] . " (" . $payload['email'] . ")";
    }
} catch (Exception $e) {
    echo "Error SSO: " . $e->getMessage();
}`})]}),c==="nodejs"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50",children:[e.jsxs("div",{children:[e.jsxs("h4",{className:"text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"File SDK: SsoSekolahClient.js (Node.js / TypeScript)"]}),e.jsx("p",{className:"text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5",children:"Async/Await Promises SDK menggunakan modul bawaan HTTP/HTTPS tanpa modul eksternal."})]}),e.jsxs("a",{href:"/sdk/SsoSekolahClient.js",download:!0,className:"px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"Download SDK (.js)"]})]}),e.jsx(t,{judul:"Cara Penggunaan (Node.js SDK)",salinKey:"sdk-js",warna:"text-emerald-300",kode:`const SsoSekolahClient = require('./SsoSekolahClient');

const client = new SsoSekolahClient('${r}', 'KUNCI_API_ANDA');

async function jalankan() {
    try {
        // 1. Uji koneksi API Key
        const status = await client.testConnection();
        console.log('Status SSO:', status.pesan);

        // 2. Ambil daftar kelas sekolah
        const kelas = await client.getKelas({ aktif: 'true' });
        console.log('Daftar Kelas:', kelas.data);

        // 3. Verifikasi Token JWT
        const tokenStr = 'EYJHBGCIOIJIUZI1...';
        const user = SsoSekolahClient.verifyJwtToken(tokenStr);
        console.log('Payload User:', user);
    } catch (err) {
        console.error('Error SSO:', err.message);
    }
}

jalankan();`})]}),c==="python"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50",children:[e.jsxs("div",{children:[e.jsxs("h4",{className:"text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"File SDK: sso_sekolah_client.py (Python 3.x)"]}),e.jsx("p",{className:"text-[11px] text-amber-700 dark:text-amber-300 mt-0.5",children:"Clean Pythonic Client Class berbasis urllib & json tanpa dependensi pip external."})]}),e.jsxs("a",{href:"/sdk/sso_sekolah_client.py",download:!0,className:"px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"Download SDK (.py)"]})]}),e.jsx(t,{judul:"Cara Penggunaan (Python SDK)",salinKey:"sdk-py",warna:"text-amber-300",kode:`from sso_sekolah_client import SsoSekolahClient

client = SsoSekolahClient('${r}', 'KUNCI_API_ANDA')

try:
    # 1. Uji koneksi API Key
    res = client.test_connection()
    print("Status SSO:", res.get('pesan'))

    # 2. Ambil data pengguna role Guru
    gurus = client.get_members(role='guru', per_page=5)
    print("Total Guru:", gurus['meta']['total'])
    for g in gurus['data']:
        print(f"- {g['nama_lengkap']} ({g['email']})")

    # 3. Verifikasi Token JWT
    payload = SsoSekolahClient.verify_jwt_token("TOKEN_JWT_HERE")
    if payload:
        print("Pengguna Terautentikasi:", payload['name'])

except Exception as e:
    print("Error SSO:", str(e))`})]}),c==="go"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-900/50",children:[e.jsxs("div",{children:[e.jsxs("h4",{className:"text-xs font-extrabold text-sky-900 dark:text-sky-200 flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"File SDK: ssoclient.go (Go / Golang)"]}),e.jsx("p",{className:"text-[11px] text-sky-700 dark:text-sky-300 mt-0.5",children:"Idiomatic Go Package dengan Struct Client, net/http, dan JWT base64 decoder."})]}),e.jsxs("a",{href:"/sdk/ssoclient.go",download:!0,className:"px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0",children:[e.jsx("span",{className:"material-symbols-rounded text-base",children:"download"}),"Download SDK (.go)"]})]}),e.jsx(t,{judul:"Cara Penggunaan (Go SDK)",salinKey:"sdk-go",warna:"text-sky-300",kode:`package main

import (
	"fmt"
	"net/url"
	"proyek-anda/ssoclient"
)

func main() {
	client := ssoclient.NewClient("${r}", "KUNCI_API_ANDA")

	// 1. Uji koneksi API Key
	tes, err := client.TestConnection()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Respon SSO:", tes["pesan"])

	// 2. Ambil Daftar Siswa
	params := url.Values{}
	params.Set("role", "siswa")
	params.Set("per_page", "5")

	members, err := client.GetMembers(params)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Data Siswa:", members["data"])

	// 3. Verifikasi Token JWT
	payload, err := ssoclient.VerifyJWTToken("TOKEN_JWT_HERE")
	if err == nil {
		fmt.Println("User Authenticated:", payload["name"])
	}
}`})]})]}),e.jsxs("section",{id:"simulasi-api",className:"bg-gradient-to-br from-[#081242] to-[#030947] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-900/10 space-y-6",children:[e.jsxs("div",{className:"border-b border-white/10 pb-4",children:[e.jsxs("h2",{className:"text-xl font-bold flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-sky-400",children:"play_circle"}),"Simulasi API Terintegrasi"]}),e.jsx("p",{className:"text-xs text-slate-300 mt-1",children:"Tes endpoint secara langsung dari browser menggunakan kunci API Anda."})]}),e.jsxs("form",{onSubmit:K,className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5",children:"API Key Anda"}),e.jsx("input",{type:"text",value:p,onChange:a=>_(a.target.value),placeholder:"Ketik atau tempel kunci API Anda",className:"w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5",children:"Endpoint"}),e.jsxs("select",{value:g,onChange:a=>v(a.target.value),className:"w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC]",children:[e.jsx("option",{value:"/api/v1/test",children:"GET /api/v1/test — Test Koneksi"}),e.jsx("option",{value:"/api/v1/members",children:"GET /api/v1/members — Daftar Pengguna"}),e.jsx("option",{value:"/api/v1/kelas",children:"GET /api/v1/kelas — Daftar Kelas"}),e.jsx("option",{value:"/api/v1/tahun-pelajaran",children:"GET /api/v1/tahun-pelajaran — Tahun Pelajaran"}),e.jsx("option",{value:"/api/v1/data/peran",children:"GET /api/v1/data/peran — Daftar Peran"}),e.jsx("option",{value:"/api/v1/data/statistik",children:"GET /api/v1/data/statistik — Statistik Sistem"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5",children:["Query Params ",e.jsx("span",{className:"text-slate-400 font-normal",children:"(Opsional)"})]}),e.jsx("input",{type:"text",value:k,onChange:a=>S(a.target.value),placeholder:"Contoh: role=siswa&aktif=true&per_page=5",className:"w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"})]}),e.jsxs("button",{type:"submit",disabled:f,className:"w-full py-2.5 bg-[#0F91FC] hover:bg-[#0a78d6] disabled:opacity-50 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#0F91FC]/20 flex items-center justify-center gap-2",children:[e.jsx("span",{className:"material-symbols-rounded text-sm",children:"send"}),f?"Mengirim...":"Kirim Request"]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("span",{className:"text-xs font-bold text-slate-300 uppercase tracking-widest block",children:"Response Output"}),e.jsx("div",{className:"bg-slate-950/60 rounded-2xl border border-white/10 p-4 min-h-[220px] max-h-[340px] overflow-y-auto font-mono text-xs",children:m?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 block",children:"// Status Code"}),e.jsx("span",{className:m.status.startsWith("200")?"text-emerald-400 font-bold":"text-rose-400 font-bold",children:m.status})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 block",children:"// Response Body"}),e.jsx("pre",{className:"text-emerald-400 overflow-x-auto whitespace-pre-wrap",children:JSON.stringify(m.body,null,2)})]})]}):e.jsx("span",{className:"text-slate-500 italic block mt-16 text-center",children:"Response akan muncul di sini setelah Anda mengklik Kirim Request."})})]})]})]})]})]})]})}G.layout=u=>e.jsx(R,{children:u,title:"Dokumentasi API & Integrasi SSO"});export{G as default};
