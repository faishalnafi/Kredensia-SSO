<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Events\PenggunaDiperbarui;
use Inertia\Inertia;
use Inertia\Response;

class ManajemenPenggunaController extends Controller
{
    /**
     * Tampilkan daftar pengguna dengan filter pencarian dan paginasi.
     */
    public function indeks(Request $request): Response
    {
        $query = User::with('roles')->orderBy('created_at', 'desc');

        // Filter pencarian
        if ($request->filled('cari')) {
            $cari = $request->cari;
            $query->where(function ($q) use ($cari) {
                $q->where('nama_lengkap', 'like', "%{$cari}%")
                  ->orWhere('email', 'like', "%{$cari}%")
                  ->orWhere('nik', 'like', "%{$cari}%")
                  ->orWhere('nip_nis', 'like', "%{$cari}%");
            });
        }

        // Paginasi dengan query string dipertahankan
        $daftarPengguna = $query->paginate(10)->withQueryString();

        // Ambil peran aktif untuk dropdown pilihan peran
        $daftarPeran = Role::where('is_active', true)->get();

        return Inertia::render('Superadmin/Pengguna/Indeks', [
            'daftarPengguna' => $daftarPengguna,
            'daftarPeran' => $daftarPeran,
            'filters' => $request->only(['cari'])
        ]);
    }

    /**
     * Simpan pengguna baru ke database.
     */
    public function simpan(Request $request): RedirectResponse
    {
        $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'jk' => ['nullable', 'string', Rule::in(['L', 'P'])],
            'tgl_lahir' => ['nullable', 'date'],
            'nik' => ['nullable', 'string', 'max:20', 'unique:users,nik'],
            'nip_nis' => ['nullable', 'string', 'max:30', 'unique:users,nip_nis'],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'selected_roles' => ['nullable', 'array'],
            'selected_roles.*' => ['exists:roles,id'],
        ], [
            'email.unique' => 'Alamat email sudah terdaftar.',
            'nik.unique' => 'NIK sudah terdaftar.',
            'nip_nis.unique' => 'Nomor Induk (NIP/NISN) sudah terdaftar.',
            'password.min' => 'Kata sandi minimal harus 8 karakter.',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'jk' => $request->jk,
                'tgl_lahir' => $request->tgl_lahir,
                'nik' => $request->nik,
                'nip_nis' => $request->nip_nis,
                'no_telp' => $request->no_telp,
                'alamat' => $request->alamat,
                'is_active' => $request->is_active,
                'claimed_at' => now(), // Otomatis aktif
            ]);

            if ($request->has('selected_roles')) {
                $user->roles()->sync($request->selected_roles);
            }
        });

        // Hapus cache agar data terbaru langsung muncul
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');
        Cache::forget('superadmin:pengguna-terbaru');

        \App\Services\LayananLogAktivitas::catat('Mendaftarkan pengguna baru: ' . $request->nama_lengkap);

        event(new PenggunaDiperbarui());

        return redirect()->back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    /**
     * Perbarui data pengguna di database.
     */
    public function perbarui(Request $request, string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'password' => ['nullable', 'string', 'min:8'],
            'jk' => ['nullable', 'string', Rule::in(['L', 'P'])],
            'tgl_lahir' => ['nullable', 'date'],
            'nik' => ['nullable', 'string', 'max:20', Rule::unique('users', 'nik')->ignore($id)],
            'nip_nis' => ['nullable', 'string', 'max:30', Rule::unique('users', 'nip_nis')->ignore($id)],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'selected_roles' => ['nullable', 'array'],
            'selected_roles.*' => ['exists:roles,id'],
        ], [
            'email.unique' => 'Alamat email sudah terdaftar.',
            'nik.unique' => 'NIK sudah terdaftar.',
            'nip_nis.unique' => 'Nomor Induk (NIP/NISN) sudah terdaftar.',
            'password.min' => 'Kata sandi minimal harus 8 karakter.',
        ]);

        // Proteksi: Tidak boleh menonaktifkan akun sendiri
        if ($id === auth()->id() && !$request->is_active) {
            return redirect()->back()->with('error', 'Gagal: Anda tidak diperbolehkan menonaktifkan akun Anda sendiri.');
        }

        DB::transaction(function () use ($user, $request) {
            $updateData = [
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'jk' => $request->jk,
                'tgl_lahir' => $request->tgl_lahir,
                'nik' => $request->nik,
                'nip_nis' => $request->nip_nis,
                'no_telp' => $request->no_telp,
                'alamat' => $request->alamat,
                'is_active' => $request->is_active,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            if ($request->has('selected_roles')) {
                $user->roles()->sync($request->selected_roles);
            }
        });

        // Hapus cache agar data terbaru langsung muncul
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');
        Cache::forget('superadmin:pengguna-terbaru');

        \App\Services\LayananLogAktivitas::catat('Memperbarui data pengguna: ' . $user->nama_lengkap);

        event(new PenggunaDiperbarui());

        return redirect()->back()->with('success', 'Data pengguna berhasil diperbarui.');
    }


    /**
     * Hapus pengguna dari database.
     */
    public function hapus(string $id): RedirectResponse
    {
        // Proteksi: Tidak boleh menghapus diri sendiri
        if ($id === auth()->id()) {
            return redirect()->back()->with('error', 'Gagal: Anda tidak diperbolehkan menghapus akun Anda sendiri.');
        }

        $user = User::findOrFail($id);

        DB::transaction(function () use ($user) {
            // Lepas relasi pivot dan hapus rekord (ACID)
            $user->roles()->detach();
            $user->koreksi()->delete();
            $user->delete();
        });

        // Hapus cache agar data terbaru langsung muncul
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');
        Cache::forget('superadmin:pengguna-terbaru');

        \App\Services\LayananLogAktivitas::catat('Menghapus pengguna: ' . $user->nama_lengkap);

        event(new PenggunaDiperbarui());

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }

    /**
     * Unduh template CSV untuk import massal pengguna.
     */
    public function unduhTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=template_import_pengguna.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $columns = [
            'nama_lengkap',
            'email',
            'password',
            'jk',
            'tgl_lahir',
            'nik',
            'nip_nis',
            'no_telp',
            'alamat',
            'nama_peran'
        ];

        $callback = function() use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            
            // Contoh data 1 (Siswa)
            fputcsv($file, [
                'Budi Santoso',
                'budi.santoso@sekolah.sch.id',
                'password123',
                'L',
                '2008-04-15',
                '3515012345670002',
                '260012345',
                '081234567891',
                'Sidoarjo, Jawa Timur',
                'Siswa'
            ]);

            // Contoh data 2 (Guru)
            fputcsv($file, [
                'Siti Aminah',
                'siti.aminah@sekolah.sch.id',
                'rahasia567',
                'P',
                '1985-08-20',
                '3515012345670003',
                '198508202010122001',
                '085712345678',
                'Surabaya, Jawa Timur',
                'Guru'
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Proses import massal pengguna dari CSV atau Excel (.xlsx).
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file_import' => ['required', 'file', 'mimes:csv,txt,xlsx', 'max:5120'],
        ], [
            'file_import.required' => 'Pilih berkas CSV atau Excel terlebih dahulu.',
            'file_import.mimes' => 'Berkas harus berformat .csv atau .xlsx.',
            'file_import.max' => 'Ukuran berkas maksimal 5MB.',
        ]);

        $file = $request->file('file_import');
        $path = $file->getRealPath();
        $extension = strtolower($file->getClientOriginalExtension());

        $dataRows = [];

        if ($extension === 'xlsx') {
            try {
                $dataRows = $this->bacaXlsx($path);
            } catch (\Exception $e) {
                return redirect()->back()->with('error', 'Gagal memproses file Excel: ' . $e->getMessage());
            }
        } else {
            // CSV
            $dataRows = array_map('str_getcsv', file($path));
        }

        if (count($dataRows) <= 1) {
            return redirect()->back()->with('error', 'Berkas kosong atau tidak memiliki data.');
        }

        // Mapping Header
        $headers = array_map('trim', $dataRows[0]);
        array_shift($dataRows);

        $suksesCount = 0;
        $gagalCount = 0;
        $errorsList = [];

        DB::beginTransaction();
        try {
            foreach ($dataRows as $index => $row) {
                if (empty(array_filter($row))) {
                    continue;
                }

                $mappedRow = [];
                foreach ($headers as $colIndex => $header) {
                    $mappedRow[$header] = isset($row[$colIndex]) ? trim((string)$row[$colIndex]) : '';
                }

                $nama = $mappedRow['nama_lengkap'] ?? '';
                $email = $mappedRow['email'] ?? '';
                $password = $mappedRow['password'] ?? '';

                if (empty($nama) || empty($email) || empty($password)) {
                    $gagalCount++;
                    $errorsList[] = "Baris " . ($index + 2) . ": Nama, Email, dan Password wajib diisi.";
                    continue;
                }

                // Cek keunikan email
                if (User::where('email', $email)->exists()) {
                    $gagalCount++;
                    $errorsList[] = "Baris " . ($index + 2) . ": Email '{$email}' sudah terdaftar.";
                    continue;
                }

                // Cek keunikan NIK jika ada
                $nik = $mappedRow['nik'] ?? null;
                if (!empty($nik) && User::where('nik', $nik)->exists()) {
                    $gagalCount++;
                    $errorsList[] = "Baris " . ($index + 2) . ": NIK '{$nik}' sudah terdaftar.";
                    continue;
                }

                // Cek keunikan NIP/NIS jika ada
                $nipNis = $mappedRow['nip_nis'] ?? null;
                if (!empty($nipNis) && User::where('nip_nis', $nipNis)->exists()) {
                    $gagalCount++;
                    $errorsList[] = "Baris " . ($index + 2) . ": NIP/NIS '{$nipNis}' sudah terdaftar.";
                    continue;
                }

                // Create User
                $user = User::create([
                    'nama_lengkap' => $nama,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'jk' => in_array($mappedRow['jk'] ?? '', ['L', 'P']) ? $mappedRow['jk'] : null,
                    'tgl_lahir' => !empty($mappedRow['tgl_lahir']) ? $mappedRow['tgl_lahir'] : null,
                    'nik' => !empty($nik) ? $nik : null,
                    'nip_nis' => !empty($nipNis) ? $nipNis : null,
                    'no_telp' => $mappedRow['no_telp'] ?? null,
                    'alamat' => $mappedRow['alamat'] ?? null,
                    'is_active' => true,
                    'claimed_at' => now(),
                ]);

                // Hubungkan peran (roles)
                $peranRaw = $mappedRow['nama_peran'] ?? '';
                if (!empty($peranRaw)) {
                    $peranList = explode(',', $peranRaw);
                    $roleIds = [];

                    foreach ($peranList as $namaPeran) {
                        $namaPeranClean = trim($namaPeran);
                        if (empty($namaPeranClean)) {
                            continue;
                        }

                        // Cari role secara case-insensitive
                        $role = Role::whereRaw('LOWER(nama_role) = ?', [strtolower($namaPeranClean)])->first();

                        if (!$role) {
                            // Buat role baru secara otomatis jika belum terdaftar
                            $role = Role::create([
                                'nama_role' => $namaPeranClean,
                                'is_active' => true
                            ]);
                        }
                        
                        $roleIds[] = $role->id;
                    }

                    if (!empty($roleIds)) {
                        $user->roles()->sync($roleIds);
                    }
                }

                $suksesCount++;
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal memproses berkas data: ' . $e->getMessage());
        }

        // Hapus cache agar data terbaru langsung muncul
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');
        Cache::forget('superadmin:pengguna-terbaru');

        \App\Services\LayananLogAktivitas::catat("Melakukan import massal pengguna via " . strtoupper($extension) . ". Sukses: {$suksesCount}, Gagal: {$gagalCount}");

        event(new PenggunaDiperbarui());

        $pesan = "Import selesai. Berhasil: {$suksesCount} pengguna.";
        if ($gagalCount > 0) {
            $pesan .= " Gagal: {$gagalCount} pengguna. Detail: " . implode(', ', $errorsList);
            return redirect()->back()->with('warning', $pesan);
        }

        return redirect()->back()->with('success', $pesan);
    }

    /**
     * Unduh template Excel untuk import massal pengguna (.xls SpreadsheetML).
     */
    public function unduhTemplateExcel()
    {
        $filename = 'template_import_pengguna.xls';
        
        $output = '<?xml version="1.0"?>' . "\n";
        $output .= '<?mso-application progid="Excel.Sheet"?>' . "\n";
        $output .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $output .= ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
        $output .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
        $output .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $output .= ' xmlns:html="http://www.w3.org/TR/REC-html40">' . "\n";
        $output .= ' <Worksheet ss:Name="Import Pengguna">' . "\n";
        $output .= '  <Table>' . "\n";
        
        // Headers row
        $output .= '   <Row>' . "\n";
        $columns = ['nama_lengkap', 'email', 'password', 'jk', 'tgl_lahir', 'nik', 'nip_nis', 'no_telp', 'alamat', 'nama_peran'];
        foreach ($columns as $col) {
            $output .= '    <Cell><Data ss:Type="String">' . htmlspecialchars($col) . '</Data></Cell>' . "\n";
        }
        $output .= '   </Row>' . "\n";
        
        // Sample data row 1
        $output .= '   <Row>' . "\n";
        $row1 = ['Budi Santoso', 'budi.santoso@sekolah.sch.id', 'password123', 'L', '2008-04-15', '3515012345670002', '260012345', '081234567891', 'Sidoarjo, Jawa Timur', 'Siswa'];
        foreach ($row1 as $val) {
            $output .= '    <Cell><Data ss:Type="String">' . htmlspecialchars((string)$val) . '</Data></Cell>' . "\n";
        }
        $output .= '   </Row>' . "\n";

        // Sample data row 2
        $output .= '   <Row>' . "\n";
        $row2 = ['Siti Aminah', 'siti.aminah@sekolah.sch.id', 'rahasia567', 'P', '1985-08-20', '3515012345670003', '198508202010122001', '085712345678', 'Surabaya, Jawa Timur', 'Guru'];
        foreach ($row2 as $val) {
            $output .= '    <Cell><Data ss:Type="String">' . htmlspecialchars((string)$val) . '</Data></Cell>' . "\n";
        }
        $output .= '   </Row>' . "\n";

        $output .= '  </Table>' . "\n";
        $output .= ' </Worksheet>' . "\n";
        $output .= '</Workbook>';

        return response($output, 200)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename=' . $filename)
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Helper untuk memparse XLSX (.zip XML) tanpa library eksternal.
     */
    private function bacaXlsx(string $path): array
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \Exception("Tidak dapat membuka berkas Excel (.xlsx).");
        }

        // 1. Baca sharedStrings.xml
        $sharedStrings = [];
        $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($stringsXml !== false) {
            $xml = simplexml_load_string($stringsXml);
            foreach ($xml->si as $si) {
                if (isset($si->t)) {
                    $sharedStrings[] = (string)$si->t;
                } else {
                    $text = '';
                    if (isset($si->r)) {
                        foreach ($si->r as $r) {
                            $text .= (string)$r->t;
                        }
                    }
                    $sharedStrings[] = $text;
                }
            }
        }

        // 2. Baca sheet1.xml
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            throw new \Exception("Struktur lembar kerja Excel tidak valid.");
        }

        $xml = simplexml_load_string($sheetXml);
        $rows = [];
        
        foreach ($xml->sheetData->row as $row) {
            $rowData = [];
            foreach ($row->c as $cell) {
                // Tentukan letak kolom (A, B, C...)
                $rAttr = (string)$cell['r'];
                preg_match('/^[A-Z]+/', $rAttr, $matches);
                $colLetter = $matches[0] ?? '';
                
                // Konversi huruf kolom ke indeks integer (0-based)
                $colIndex = 0;
                $len = strlen($colLetter);
                for ($i = 0; $i < $len; $i++) {
                    $colIndex = $colIndex * 26 + (ord($colLetter[$i]) - 64);
                }
                $colIndex = $colIndex - 1;

                $val = '';
                if (isset($cell->v)) {
                    $val = (string)$cell->v;
                    if ((string)$cell['t'] === 's') {
                        $val = $sharedStrings[(int)$val] ?? '';
                    }
                }
                $rowData[$colIndex] = $val;
            }
            
            // Isi kolom-kolom yang terlewat agar array index berurutan
            if (!empty($rowData)) {
                $maxIndex = max(array_keys($rowData));
                for ($i = 0; $i <= $maxIndex; $i++) {
                    if (!isset($rowData[$i])) {
                        $rowData[$i] = '';
                    }
                }
                ksort($rowData);
            }
            $rows[] = $rowData;
        }

        $zip->close();
        return $rows;
    }
}
