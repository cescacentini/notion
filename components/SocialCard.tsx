import type { SocialPost } from "@/lib/notion";

function statusBadge(status: string) {
  switch (status) {
    case "Published":
      return "bg-neutral-900 text-white";
    case "Scheduled":
      return "bg-neutral-700 text-white";
    case "Finished":
    case "To review":
      return "bg-neutral-200 text-neutral-700";
    case "Recorded":
    case "Editing":
      return "bg-neutral-100 text-neutral-600";
    case "Drafted/scripted":
      return "bg-neutral-100 text-neutral-500";
    case "Idea":
      return "border border-neutral-200 text-neutral-400";
    default:
      return "bg-neutral-100 text-neutral-500";
  }
}

export default function SocialCard({ posts }: { posts: SocialPost[] }) {
  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
          Content today
        </p>
      </div>
      {posts.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-sm text-neutral-400">Nothing scheduled today</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <p className="text-sm text-neutral-900 truncate flex-1">{post.name}</p>
              {post.status && (
                <span
                  className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(post.status)}`}
                >
                  {post.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
