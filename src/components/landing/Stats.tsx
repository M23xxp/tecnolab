import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users, Award } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

const stats = [
  { icon: GraduationCap, value: 100, suffix: "+", label: "طالب تم تدريبهم" },
  { icon: BookOpen, value: 15, suffix: "", label: "دورة مكتملة" },
  { icon: Users, value: 2, suffix: "", label: "مدرّب متخصص" },
  { icon: Award, value: 95, suffix: "%", label: "نسبة رضا المتدربين" },
];

export function Stats() {
  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            أرقامنا تتحدث عنا
          </h2>
          <p className="mt-3 text-muted-foreground">
            إنجازات حقيقية في تمكين الشباب وبناء قدراتهم
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                <AnimatedCounter value={s.value} />
                {s.suffix && <span className="text-primary">{s.suffix}</span>}
              </div>
              <p className="mt-2 text-sm md:text-base text-muted-foreground font-medium">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
