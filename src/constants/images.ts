/**
 * Images bundled with the site (public/images). The free Spark plan has no
 * Cloud Storage, so campus and faculty photos are static files deployed with
 * the app instead of admin uploads. To add one: put an optimised .webp in the
 * right folder, list it here, and redeploy.
 */

export interface BundledImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export const CAMPUS_IMAGES = {
  hero: {
    src: "/images/campus/main-building-golden-hour.webp",
    width: 1774,
    height: 887,
    alt: "The domed main building of Manipal University Jaipur at golden hour, with columned wings and palm-lined flower beds",
  },
  gallery: [
    {
      src: "/images/campus/dome-and-lawn.webp",
      width: 1086,
      height: 1448,
      alt: "Manipal University Jaipur's domed main building seen across a green lawn, with palm trees and students walking by",
    },
    {
      src: "/images/campus/dome-through-trees.webp",
      width: 1024,
      height: 1536,
      alt: "The main building's dome framed by orange-leaved trees along a paved campus walkway",
    },
  ],
} as const satisfies { hero: BundledImage; gallery: readonly BundledImage[] };

/** Every bundled campus image, for the hero picker in Admin → Settings. */
export const CAMPUS_IMAGE_OPTIONS: { value: string; label: string }[] = [
  { value: CAMPUS_IMAGES.hero.src, label: "Main building at golden hour (landscape, default)" },
  { value: CAMPUS_IMAGES.gallery[0].src, label: "Dome and lawn (portrait)" },
  { value: CAMPUS_IMAGES.gallery[1].src, label: "Dome through trees (portrait)" },
];

/** Bundled faculty headshots (320×320, circular crop). File name = faculty id. */
export const FACULTY_PHOTO_IDS = [
  "ajay-kumar",
  "ashok-kumar-kumawat",
  "hemant-kumar",
  "himanshu",
  "krishna-kant-pandey",
  "kumar-gaurav",
  "manish-rawat",
  "mohit-jain",
  "mrinmoy-misra",
  "nikhil-vivek-shrivas",
  "prabhat-ranjan",
  "shahbaz-ahmed-siddiqui",
  "varun-jurwall",
] as const;

export const facultyPhotoPath = (id: string) => `/images/faculty/${id}.webp`;

/** A path to a bundled image: what the photo / hero pickers store instead of an upload URL. */
export const BUNDLED_IMAGE_PATH = /^\/images\/(campus|faculty)\/[a-z0-9-]+\.(webp|png|jpe?g)$/;

const titleCase = (id: string) => id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const FACULTY_PHOTO_OPTIONS: { value: string; label: string }[] = FACULTY_PHOTO_IDS.map((id) => ({ value: facultyPhotoPath(id), label: `${titleCase(id)} (${id}.webp)` }));
