<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon Sementara -->
        <link rel="icon" type="image/png" href="https://support.nafii.my.id/icon/domains.png">


        <!-- Google reCAPTCHA Enterprise -->
        @if(env('RECAPTCHA_SITE_KEY') && env('RECAPTCHA_PROJECT_ID') && env('RECAPTCHA_API_KEY'))
            <script src="https://www.google.com/recaptcha/enterprise.js?render={{ env('RECAPTCHA_SITE_KEY') }}"></script>
        @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
