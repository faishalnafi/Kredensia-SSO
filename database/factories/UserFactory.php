<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama_lengkap'            => fake()->name(),
            'email'                   => fake()->unique()->safeEmail(),
            'password'                => static::$password ??= Hash::make('password'),
            'remember_token'          => Str::random(10),
            'biodata_dilengkapi_pada' => now(),
        ];
    }

    /**
     * State for unverified / unclaimed user.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'claimed_at' => null,
        ]);
    }

    /**
     * State for user with uncompleted biodata.
     */
    public function uncompletedBiodata(): static
    {
        return $this->state(fn (array $attributes) => [
            'biodata_dilengkapi_pada' => null,
        ]);
    }
}

