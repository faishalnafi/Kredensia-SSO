<?php

use App\Services\LayananSesiPerangkat;
use Illuminate\Support\Facades\Broadcast;

# ID pengguna berupa UUID, jadi dibandingkan sebagai string (bukan integer)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

# Kanal privat per sesi browser: hanya browser pemilik sesi tersebut yang boleh berlangganan
Broadcast::channel('sesi.{kanal}', function ($user, string $kanal) {
    return hash_equals(LayananSesiPerangkat::kanalSesi(request()->session()->getId()), $kanal);
});
