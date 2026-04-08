export function ShareCardPreview() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-8">
      <div
        className="flex flex-col items-center justify-center bg-[#0a0a0a] rounded-lg"
        style={{ width: 540, height: 540, padding: 40 }}
      >
        <div
          className="rounded-full overflow-hidden mb-6"
          style={{ width: 160, height: 160 }}
        >
          <img
            src="/__mockup/images/tqf-logo-1024-rnd.png"
            alt="The Quiet Frame"
            className="w-full h-full object-contain"
          />
        </div>

        <h1
          className="text-white text-center mb-2"
          style={{ fontSize: 32, fontWeight: 300, letterSpacing: 1 }}
        >
          The Quiet Frame
        </h1>

        <p
          className="text-center italic mb-9"
          style={{ fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}
        >
          a small app about being present
        </p>

        <div className="flex items-center gap-3">
          <img
            src="/__mockup/images/badge-app-store.png"
            alt="Download on the App Store"
            style={{ width: 110, height: 33 }}
            className="object-contain"
          />
          <img
            src="/__mockup/images/badge-google-play.png"
            alt="Get it on Google Play"
            style={{ width: 124, height: 33 }}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
