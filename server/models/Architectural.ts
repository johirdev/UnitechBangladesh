import mongoose, { Schema } from "mongoose";

/**
 * UNITECH Architectural পেজ (/unitech-architectural) — একটি মাত্র ডকুমেন্ট।
 * সব কনটেন্ট ইংরেজিতে, অ্যাডমিন প্যানেল → "আর্কিটেকচারাল পেজ" থেকে বদলানো যায়।
 */
const s = (def = "") => ({ type: String, trim: true, default: def });
const opt = { _id: false };

const statSchema = new Schema({ value: s(), label: s() }, opt);
const offerSchema = new Schema({ image: s(), title: s(), highlight: s(), label: s(), price: s(), unit: s() }, opt);
const tabSchema = new Schema({ icon: s(), name: s(), title: s(), text: s() }, opt);
const projectSchema = new Schema({ image: s(), title: s(), location: s(), year: s() }, opt);
const addressSchema = new Schema({ label: s(), address: s(), phone: s(), mapUrl: s() }, opt);
const serviceSchema = new Schema({ icon: s(), title: s(), description: s() }, opt);

const archSchema = new Schema(
  {
    key: { type: String, default: "architectural", unique: true },
    isActive: { type: Boolean, default: true },
    hero: {
      badge: s("UNITECH Architectural"),
      title: s("Plan your dream home in safe hands"),
      subtitle: s("Architectural, RAJUK-approved, structural, electrical and plumbing drawings, soil tests and interior design, all under one roof."),
      image: s("/images/architectural/project-2.jpeg"),
      background: s("/images/architectural/offer.jpg"),
      ctaText: s("Call for a free consultation"),
    },
    about: {
      title: s("About Us"),
      text: s(
        "Unitech Architectural is an engineering firm that designs beautiful and quality complete buildings at low cost. Our engineering team always tries its best to provide a good design. Our organization always strives to design the best for the sake of the country and nation.",
      ),
      image: s("/images/architectural/banner.jpg"),
    },
    milestone: {
      title: s("Our Milestone"),
      text: s("Unitech Architectural is a trusted place for thousands of people in Bangladesh. We have designed over a hundred buildings in the last five years, and we share our knowledge with every client."),
    },
    offers: { type: [offerSchema], default: () => [{ image: "/images/architectural/offer.jpg", title: "Plan your home in", highlight: "safe hands", label: "Only at", price: "BDT 5000/-", unit: "Per floor" }] },
    intro: {
      badge: s("Successfully 5 Years"),
      title: s("World-Renowned IT Expert Making Organization"),
      text: s(
        "Unitech Bangladesh has been working with a vision to create skilled IT and engineering professionals. In a fast-paced world where every sector relies on technology, you need modern skills to secure a better future. With utmost dedication, we have trained thousands of students who now work in different sectors.",
      ),
      image: s("/images/architectural/organization.png"),
    },
    stats: {
      type: [statSchema],
      default: () => [
        { value: "546+", label: "Successful Students" },
        { value: "280+", label: "Expert Freelancers" },
        { value: "180+", label: "Skilled Job Holders" },
        { value: "500+", label: "Industry Experts" },
        { value: "91%", label: "Success Ratio" },
        { value: "700+", label: "Companies" },
      ],
    },
    certification: {
      title: s("One of the DNCC Certified IT Institutes in Dhaka"),
      text: s(
        "In 2024, Unitech Bangladesh proudly attained official certification from the Dhaka North City Corporation (DNCC), underscoring its dedication to operational excellence and adherence to rigorous standards. This recognition is a testament to our commitment to delivering high-quality services, and it paves the way for continued growth and positive contributions to the community.",
      ),
      image: s("/images/architectural/iso.png"),
    },
    tabs: {
      type: [tabSchema],
      default: () => [
        { icon: "/images/architectural/tab-goal.png", name: "Our Goal", title: "Empowering the next generation", text: "We aspire to empower the young generation by providing quality training on trending topics and by delivering safe, affordable building designs." },
        { icon: "/images/architectural/tab-vision.png", name: "Our Vision", title: "Safe homes for every family", text: "We envision a Bangladesh where every building is properly planned, approved and engineered for safety and comfort." },
        { icon: "/images/architectural/tab-history.png", name: "History", title: "Five years of trusted design", text: "Unitech Architectural is an engineering firm that designs beautiful and quality complete buildings at low cost. Over the last five years we have delivered more than a hundred building plans." },
        { icon: "/images/architectural/tab-culture.png", name: "Culture", title: "Client-first engineering", text: "Our team works closely with every client, explains every drawing clearly and keeps every project transparent from first sketch to final approval." },
        { icon: "/images/architectural/tab-values.png", name: "Our Values", title: "Quality, honesty and safety", text: "We never compromise on structural safety, we keep our pricing honest, and we deliver on time." },
      ],
    },
    initiativesTitle: s("Prominent Initiatives"),
    initiatives: {
      type: [statSchema],
      default: () => [
        { value: "6000+", label: "Students received career counseling" },
        { value: "3000+", label: "Women got IT training on full free scholarship" },
        { value: "1000+", label: "Students got online internship facilities" },
        { value: "100+", label: "Physically challenged people received IT training" },
        { value: "4000+", label: "Financially deprived people got IT scholarships" },
        { value: "200+", label: "Polytechnics attached for training" },
        { value: "50+", label: "Senior citizens got IT scholarships" },
        { value: "200+", label: "Building plan designs" },
      ],
    },
    // সর্বশেষ ডেলিভারি দেওয়া প্রজেক্ট
    latestTitle: s("Last Delivered Project"),
    latest: {
      title: s("6-Storied Residential Building"),
      location: s("Farmgate, Dhaka"),
      year: s("2024"),
      description: s("Complete architectural, structural, electrical and plumbing drawings with RAJUK approval support, delivered on schedule."),
      image: s("/images/architectural/project-6.jpg"),
    },
    projectsTitle: s("Our Last Projects"),
    projectsSubtitle: s("A glimpse of the buildings we recently designed and delivered."),
    projects: {
      type: [projectSchema],
      default: () => [
        { image: "/images/architectural/project-1.jpeg", title: "Duplex Residence", location: "Dhaka", year: "2024" },
        { image: "/images/architectural/project-2.jpeg", title: "10-Storied Apartment", location: "Gazipur", year: "2024" },
        { image: "/images/architectural/project-3.jpeg", title: "Green Apartment Building", location: "Savar", year: "2023" },
        { image: "/images/architectural/project-4.jpeg", title: "Rooftop Garden Residence", location: "Narayanganj", year: "2023" },
        { image: "/images/architectural/project-5.jpeg", title: "Mixed-Use Commercial Building", location: "Cumilla", year: "2023" },
      ],
    },
    addressTitle: s("Our Address"),
    addresses: {
      type: [addressSchema],
      default: () => [
        { label: "Head Office", address: "Room #707, 14/A Indira Road, Mahbub Plaza (6th floor), Farmgate, Dhaka-1215", phone: "01765-454578", mapUrl: "" },
        { label: "Savar Office", address: "Room #707, 14/A Indira Road, Mahbub Plaza (6th floor), Farmgate, Dhaka-1215", phone: "01830-330129", mapUrl: "" },
      ],
    },
    servicesTitle: s("Our Services"),
    services: {
      type: [serviceSchema],
      default: () => [
        { icon: "/images/architectural/service-1.png", title: "Municipal Seat Plan", description: "" },
        { icon: "/images/architectural/service-2.png", title: "Working Drawing", description: "" },
        { icon: "/images/architectural/service-3.png", title: "Structural Drawings", description: "" },
        { icon: "/images/architectural/service-4.png", title: "Electrical Drawing", description: "" },
        { icon: "/images/architectural/service-5.png", title: "Materials Estimating", description: "" },
        { icon: "/images/architectural/service-6.png", title: "Plumbing Drawing", description: "" },
        { icon: "/images/architectural/service-7.png", title: "Architectural Drawing", description: "" },
        { icon: "/images/architectural/service-8.png", title: "3D Design", description: "" },
      ],
    },
    contact: { phone: s("01765-454578"), phone2: s("01705100763"), email: s(""), whatsapp: s("") },
  },
  { timestamps: true },
);

export const Architectural = mongoose.model("Architectural", archSchema);

export async function getArchitectural() {
  let a = await Architectural.findOne({ key: "architectural" }).lean();
  if (!a) a = (await Architectural.create({ key: "architectural" })).toObject();
  return a;
}
