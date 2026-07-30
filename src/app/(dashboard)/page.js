'use client';

import Home from "./(pages)/home/page";


// "/" lands on the create-hero home page (greeting + prompt composer +
// template rails) — the first thing a user sees after login. The old overview
// content now lives at /statistics.
export default function Dashboard() {
    return <Home />;
}
