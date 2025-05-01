// app/page.js or your relevant page file
import HorizontalScrollGallery from "@/components/horizontalScrollGallery";
import Head from "next/head";

export default function Home() {
  // --- ADJUSTMENT: Update number of panels and height ---
  const numberOfPanels = 3; // We now have 3 panels defined in the component
  const galleryHeight = `${numberOfPanels * 100}vh`; // Adjust height (e.g., 300vh)
  // --- End Adjustment ---

  return (
    <div>
      <Head>
        <title>Parallax Vehicle Scroll</title>
        <meta
          name="description"
          content="Next.js Horizontal Scroll with Parallax Title"
        />
        <link rel="icon" href="/favicon.ico" />
        {/* Link Geist font if needed */}
        {/* <link rel="stylesheet" href="URL_TO_GEIST_FONT" /> */}
      </Head>

      <main>
        <section
          style={{
            height: "100vh", // Keep intro section
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "lightblue", // Example background
          }}
        >
          <h1>Scroll Down To Begin</h1>
        </section>

        {/* Render the gallery with adjusted height */}
        <HorizontalScrollGallery height={galleryHeight} />

        <section
          style={{
            height: "100vh", // Keep outro section
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "lightcoral", // Example background
          }}
        >
          <h1>End of Horizontal Scroll Section</h1>
        </section>
      </main>
    </div>
  );
}
