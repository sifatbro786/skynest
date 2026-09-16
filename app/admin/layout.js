export const metadata = {
  title: { default: "অ্যাডমিন", template: "%s · অ্যাডমিন" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return children;
}
