import { motion } from "framer-motion";
import { Heart, HandHeart } from "lucide-react";

const partners = [
  {
    name: "جمعية العرفان الخيرية",
    desc: "منظمة خيرية رائدة في دعم وتمكين الفئات الأكثر احتياجاً عبر برامج تعليمية وتنموية.",
    icon: Heart,
  },
  {
    name: "منظمة CARE",
    desc: "منظمة دولية إنسانية تعمل على مكافحة الفقر العالمي وتمكين المجتمعات حول العالم.",
    icon: HandHeart,
  },
];

export function Partners() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            شركاء التميّز
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            تعاون مثمر يجمع بين خبرات محلية ودولية لخدمة الشباب وتطوير قدراتهم
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {partners.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: i === 0 ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <p.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
