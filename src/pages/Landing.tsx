import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, Utensils, Dumbbell, Heart, Shield, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo-plenya.png';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Brain,
    title: 'Manu IA — Sua Mentora',
    description: 'Uma psicóloga IA empática que entende seu ciclo, humor e momento de vida.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Utensils,
    title: 'Cardápios da Fase',
    description: 'Receitas personalizadas para cada fase do ciclo, com foco hormonal.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Dumbbell,
    title: 'Treinos Inteligentes',
    description: 'Exercícios adaptados ao seu nível de energia e fase biológica.',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    icon: Heart,
    title: 'Autocuidado 360°',
    description: 'Sintomas, humor, sono, intimidade — tudo correlacionado pela Manu.',
    gradient: 'from-rose-500 to-pink-600',
  },
];

const socialProof = [
  { value: '15k+', label: 'Mulheres ativas' },
  { value: '4.9', label: 'Nota na App Store' },
  { value: '98%', label: 'Satisfação' },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-12 pb-16 max-w-lg mx-auto text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 rounded-full bg-accent/10 blur-[80px]" />
        </div>

        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <img src={logoImage} alt="Plenya" className="w-16 h-16 mx-auto mb-6 rounded-2xl shadow-lg" />
        </motion.div>

        <motion.h1
          className="text-3xl font-bold tracking-tight text-foreground leading-tight"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Descubra seu{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            superpoder hormonal
          </span>{' '}
          com a Manu IA.
        </motion.h1>

        <motion.p
          className="text-muted-foreground mt-4 text-base leading-relaxed"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          O primeiro app de biohacking feminino que traduz seu ciclo em produtividade, nutrição e bem-estar.
        </motion.p>

        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="w-full max-w-xs h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Começar meu Biohacking Grátis
          </Button>
        </motion.div>

        {/* Social proof pills */}
        <motion.div
          className="flex justify-center gap-4 mt-8"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {socialProof.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Bento Grid */}
      <section className="px-6 pb-16 max-w-lg mx-auto">
        <motion.h2
          className="text-xl font-bold text-foreground text-center mb-6 tracking-tight"
          {...fadeUp}
          transition={{ duration: 0.5 }}
        >
          Tudo que você precisa, em um só app.
        </motion.h2>

        <motion.div className="grid grid-cols-2 gap-3" variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}>
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="group rounded-3xl bg-card border border-border/50 p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default"
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Manu IA Showcase */}
      <section className="px-6 pb-16 max-w-lg mx-auto">
        <motion.div
          className="rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border border-primary/10 p-6 text-center"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          {/* Orb */}
          <motion.div
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          <h3 className="font-bold text-foreground text-lg mt-4 tracking-tight">Conheça a Manu IA</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Sua mentora pessoal de biohacking. Ela cruza seus dados de ciclo, humor, sono e nutrição para gerar insights únicos — só seus.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Empática', 'Científica', 'Personalizada'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonial */}
      <section className="px-6 pb-16 max-w-lg mx-auto">
        <motion.div
          className="rounded-3xl bg-card border border-border/50 p-6"
          {...fadeUp}
          transition={{ duration: 0.5 }}
        >
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm text-foreground italic leading-relaxed">
            "Pela primeira vez, entendi por que alguns dias minha energia despenca. A Manu me mostrou padrões que eu nunca teria visto sozinha."
          </p>
          <p className="text-xs text-muted-foreground mt-3">— Carolina M., 29 anos</p>
        </motion.div>
      </section>

      {/* Security badges */}
      <section className="px-6 pb-16 max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="text-xs">LGPD Compliance</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs">Dados criptografados</span>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs">100% seguro</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20 max-w-lg mx-auto text-center">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="w-full max-w-xs h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
          >
            Começar Agora — É Grátis
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Sem cartão de crédito. Cancele quando quiser.</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
