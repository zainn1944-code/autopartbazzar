import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

const MODEL_CREDITS = [
  {
    title: "BMW M4 Competition M Package",
    author: "SRT Performance",
    license: "CC BY 4.0",
    sourceUrl: "https://sketchfab.com/3d-models/bmw-m4-competition-m-package-5c0a2dafb1ad408d9fc9eeef9aee531b",
    assetPath: "/models/bmw/m4.glb",
  },
  {
    title: '2023 Toyota GR Supra RZ DB42 "Pandem Kit"',
    author: "My Car Collection (Game_mode)",
    license: "CC BY 4.0",
    sourceUrl: "https://sketchfab.com/3d-models/2023-toyota-gr-supra-rz-db42-pandem-kit-1fa7b2dc48f340878d9e5aaf1000971d",
    assetPath: "/models/toyota/supra.glb",
  },
  {
    title: "Lamborghini Huracan LP-6104 2014",
    author: "MdMahib",
    license: "CC BY 4.0",
    sourceUrl: "https://sketchfab.com/3d-models/lamborghini-huracan-lp-6104-2014-4b7b162bcb4f48849f30b1c25b3102a3",
    assetPath: "/models/lamborghini/huracan.glb",
  },
];

export default function Credits() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">3D Model Credits</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
            The garage uses CC BY 4.0 vehicle models. Credit is retained here for the
            BMW, Toyota, and Lamborghini assets bundled with the configurator.
          </p>
        </div>

        <div className="space-y-4">
          {MODEL_CREDITS.map((model) => (
            <section
              key={model.assetPath}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-xl font-semibold">{model.title}</h2>
              <p className="mt-2 text-sm text-neutral-300">Author: {model.author}</p>
              <p className="text-sm text-neutral-300">License: {model.license}</p>
              <p className="text-sm text-neutral-300">Local asset: {model.assetPath}</p>
              <a
                href={model.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-red-400 underline-offset-4 hover:underline"
              >
                View original source
              </a>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs leading-6 text-neutral-400">
          Legacy Honda and shared accessory assets were already present in the repository
          before this change and should be audited separately if you need complete
          attribution coverage for every historical asset.
        </p>
      </main>
      <Footer />
    </div>
  );
}
