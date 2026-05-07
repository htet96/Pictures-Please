"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

interface Gallery {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  password: string | null;
  _count: { photos: number };
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function GalleryGrid({ galleries }: { galleries: Gallery[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {galleries.map((gallery) => (
        <motion.div key={gallery.id} variants={item}>
          <Link href={`/gallery/${gallery.slug}`} className="group block">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-card border border-border rounded-sm p-6 shadow-sharp hover:border-primary/40 hover:shadow-sharp-hover transition-colors cursor-pointer"
            >
              {/* Amber accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/0 group-hover:bg-primary/80 transition-all duration-300 rounded-l-sm" />

              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                  {gallery.name}
                </h2>
                {gallery.password && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                )}
              </div>

              {gallery.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {gallery.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-medium text-muted-foreground/70 tracking-wide uppercase">
                  {gallery._count.photos} photo{gallery._count.photos !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-primary/0 group-hover:text-primary/70 transition-colors font-medium tracking-wide">
                  View →
                </span>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
