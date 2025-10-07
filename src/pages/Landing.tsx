import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, BookOpen, Zap, Code } from "lucide-react";
import { SiInstagram, SiLinkedin, SiYoutube, SiFacebook, SiTiktok } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import TextType from "@/components/TextType";
import FallingText from "@/components/FallingText";
import MagicButton from "@/components/MagicButton";
import Threads from "@/components/Threads";
import LogoLoop from "@/components/LogoLoop";
import ShinyText from "@/components/ShinyText";
import ScrambledText from "@/components/ScrambledText";
import RotatingText from "@/components/RotatingText";

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/auth");
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Trilhas de Aprendizado",
      description:
        "Capacite-se seguindo trilhas estruturadas de diversos conteúdos",
    },
    {
      icon: <Trophy className="h-8 w-8 text-warning" />,
      title: "Rankings Mensais",
      description:
        "Compete com os demais membros e apareça no ranking dos melhores",
    },
    {
      icon: <Target className="h-8 w-8 text-info" />,
      title: "Progressão Gamificada",
      description:
        "Avance níveis, mantenha sequências e desbloqueie conquistas",
    },
    {
      icon: <Users className="h-8 w-8 text-success" />,
      title: "Múltiplas Áreas",
      description: "Software, Eletrônica, Liderança, Gestão e muito mais",
    },
  ];

  const categories = ["Software", "Eletrônica", "Liderança", "Gestão"];

  const socialLogos = [
    {
      node: <SiInstagram className="text-foreground" />,
      title: "Instagram",
      href: "https://instagram.com/eletronjun",
    },
    {
      node: <SiLinkedin className="text-foreground" />,
      title: "LinkedIn",
      href: "https://linkedin.com/company/eletronjun",
    },
    {
      node: <SiYoutube className="text-foreground" />,
      title: "YouTube",
      href: "https://youtube.com/@eletronjun",
    },
    {
      node: <SiFacebook className="text-foreground" />,
      title: "Facebook",
      href: "https://facebook.com/eletronjun",
    },
    {
      node: <SiTiktok className="text-foreground" />,
      title: "TikTok",
      href: "https://tiktok.com/@eletronjun",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-xl p-2">
              <span className="text-primary-foreground font-bold text-xl">
                <img
                  src="public/Logo-EletronJun.png"
                  alt="EletronJun Logo"
                  className="w-20 h-20 mb-8 mx-auto object-contain"
                />
              </span>
            </div>
            <div style={{ minHeight: "60px" }}>
              <h1 className="text-xl font-bold text-foreground">CapacitaJun</h1>
              <FallingText
                text="EletronJun"
                highlightWords={["EletronJun"]}
                highlightClass="highlighted"
                trigger="hover"
                backgroundColor="transparent"
                wireframes={false}
                gravity={0.56}
                fontSize="0.75rem"
                mouseConstraintStiffness={0.9}
                className="text-muted-foreground"
              />
            </div>
          </div>

          <MagicButton
            onClick={handleLogin}
            className="bg-gradient-primary shadow-medium"
            enableStars={false}
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect={true}
            glowColor="27, 184, 205"
          >
            Entrar
          </MagicButton>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 bg-gradient-secondary">
            🚀 <ShinyText text="Sistema de Capacitações EletronJUN" speed={3} />
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            <TextType
              text={["Capacitação da EletronJun", "Aprenda. Pratique. Evolua.", "Seu futuro começa aqui."]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="|"
              className="inline-block"
            />
          </h1>

          <div className="mb-8">
            <ScrambledText
              radius={100}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:"
              className="max-w-2xl mx-auto text-muted-foreground"
            >
              Desenvolva suas habilidades através de trilhas gamificadas. Assista vídeos, responda questões e compete com seus colegas no ranking mensal.
            </ScrambledText>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <MagicButton
              onClick={handleLogin}
              className="bg-gradient-primary shadow-strong text-lg px-8 py-6 h-auto"
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              particleCount={12}
              glowColor="27, 184, 205"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Começar Agora
            </MagicButton>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-2 border-border shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories Preview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            <span className="mr-3">Capacite-se em</span>
            <RotatingText
              texts={categories}
              mainClassName="inline-flex px-4 py-2 bg-gradient-primary text-primary-foreground rounded-lg"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </h2>
        </div>

        {/* How it Works */}
        <div className="bg-card rounded-3xl p-8 shadow-medium border-2 border-border mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Como Funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  1
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Assista o Conteúdo
              </h3>
              <p className="text-muted-foreground">
                Vídeos e materiais curados para cada trilha de aprendizado
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-secondary rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-xl">
                  2
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Responda as Questões
              </h3>
              <p className="text-muted-foreground">
                15 questões para cada lição. Acerte 80% para avançar
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-tertiary to-success rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Avance na Trilha
              </h3>
              <p className="text-muted-foreground">
                Desbloqueie novas lições e suba no ranking mensal
              </p>
            </div>
          </div>
        </div>

        {/* Threads Effect */}
        <div style={{ width: '100%', height: '400px', position: 'relative', marginBottom: '4rem' }}>
          <Threads
            color={[0.11, 0.72, 0.8]}
            amplitude={1}
            distance={0}
            enableMouseInteraction={true}
          />
        </div>

        {/* Social Media */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Siga a EletronJun
          </h2>
          <div style={{ height: '120px', position: 'relative', overflow: 'hidden' }}>
            <LogoLoop
              logos={socialLogos}
              speed={80}
              direction="left"
              logoHeight={48}
              gap={60}
              pauseOnHover
              scaleOnHover
              fadeOut
              ariaLabel="EletronJun nas redes sociais"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se aos seus colegas da EletronJUN e desenvolva novas
            habilidades de forma divertida e eficaz.
          </p>

          <MagicButton
            onClick={handleLogin}
            className="bg-gradient-primary shadow-strong text-lg px-8 py-6 h-auto"
            enableStars={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            particleCount={12}
            glowColor="27, 184, 205"
          >
            <Target className="h-5 w-5 mr-2" />
            Entrar com Email EletronJUN
          </MagicButton>
        </div>
      </div>
    </div>
  );
};

export default Landing;
