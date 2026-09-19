export const metadata = {
    title: { default: "অ্যাডমিন", template: "%s · অ্যাডমিন" },
    robots: { index: false, follow: false, nocache: true },

    /**
     * Emits <meta name="google" content="notranslate">.
     *
     * The panel is Bangla and `<html lang="bn">`, so Chrome offers — and if the
     * owner ever clicked "Always translate", silently performs — a machine
     * translation. Chrome Translate rewrites text nodes in place, wrapping them
     * in its own <font> elements. React still holds references to the original
     * nodes, so the next re-render calls removeChild on a node that is no
     * longer where React left it, throws NotFoundError, and unmounts the whole
     * tree: the page paints, then goes white.
     *
     * Firefox does not auto-translate, which is exactly why the same build
     * worked there and not in Chrome.
     */
    other: { google: "notranslate" },
};

export default function AdminLayout({ children }) {
    return children;
}
