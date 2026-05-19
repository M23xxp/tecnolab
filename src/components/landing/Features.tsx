import { motion } from "framer-motion";
import { Laptop, Users2, CalendarCheck, FileBadge } from "lucide-react";

const features = [
  { icon: Laptop, title: "دورات تقنية متقدمة", desc: "محتوى عملي يواكب أحدث تقنيات سوق العمل في البرمجة والتصميم والذكاء الاصطناعي." },
  { icon: Users2, title: "مدرّبون خبراء", desc: "نخبة من المتخصصين أصحاب الخبرة العملية في كبرى الشركات والمشاريع التقنية." },
  { icon: CalendarCheck, title: "جدولة مرنة للجلسات", desc: "نظام حجز ذكي يتيح لك متابعة جلساتك ومواعيدك بسهولة وفي أي وقت." },
  { icon: FileBadge, title: "ملفات عمل وموارد", desc: "وصول كامل لملفات العمل والمراجع التي تحتاجها لإكمال كل دورة بكفاءة." },
];

export function Features() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            لماذا تكنو لاب؟
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            تجربة تعليمية متكاملة مصممة لتأهيلك لسوق العمل الرقمي
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
