import { cn } from "@/lib/utils";

/**
 * YouTube / Facebook embed for `Animal.videoUrl`.
 *
 * The field is a link the owner pastes, not an upload — mp4 hosting is out of
 * scope by project rule. So the only job here is turning whatever shape of URL
 * they pasted into an embeddable one, and refusing anything it does not
 * recognise rather than dropping an arbitrary third-party URL into an iframe.
 *
 * `youtube-nocookie` because the visitor has not consented to anything; the
 * privacy-enhanced host does not set tracking cookies until playback starts.
 */
function parseVideo(url) {
    if (!url) return null;

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
        const id = parsed.pathname.slice(1).split("/")[0];
        return id ? { kind: "youtube", id } : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
        // watch?v=ID, /embed/ID, /shorts/ID and /live/ID all appear in the wild.
        const v = parsed.searchParams.get("v");
        if (v) return { kind: "youtube", id: v };

        const m = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
        if (m) return { kind: "youtube", id: m[2] };
        return null;
    }

    if (host === "facebook.com" || host === "fb.watch" || host === "web.facebook.com") {
        return { kind: "facebook", href: parsed.toString() };
    }

    return null;
}

export default function VideoEmbed({ url, title, className }) {
    const video = parseVideo(url);
    if (!video) return null;

    const src =
        video.kind === "youtube"
            ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?rel=0`
            : `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                  video.href
              )}&show_text=false`;

    return (
        <div className={cn("frame relative aspect-3/2 bg-ink", className)}>
            <iframe
                src={src}
                title={title || "ভিডিও"}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
            />
        </div>
    );
}
