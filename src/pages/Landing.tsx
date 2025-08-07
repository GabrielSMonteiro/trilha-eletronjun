import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, BookOpen, Zap, Code } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  
  const handleLogin = () => {
    navigate("/auth");
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Trilhas de Aprendizado",
      description: "Capacite-se seguindo trilhas estruturadas como no Duolingo"
    },
    {
      icon: <Trophy className="h-8 w-8 text-warning" />,
      title: "Rankings Mensais",
      description: "Compete com seus colegas e apareça no ranking dos melhores"
    },
    {
      icon: <Target className="h-8 w-8 text-info" />,
      title: "Progressão Gamificada",
      description: "Avance níveis, mantenha sequências e desbloqueie conquistas"
    },
    {
      icon: <Users className="h-8 w-8 text-success" />,
      title: "Múltiplas Áreas",
      description: "Software, Eletrônica, Liderança, Gestão e muito mais"
    }
  ];

  const categories = [
    { name: "Software", icon: <Code className="h-5 w-5" />, color: "text-blue-500" },
    { name: "Eletrônica", icon: <Zap className="h-5 w-5" />, color: "text-yellow-500" },
    { name: "Liderança", icon: <Users className="h-5 w-5" />, color: "text-purple-500" },
    { name: "Gestão", icon: <Target className="h-5 w-5" />, color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-xl p-2">
              <span className="text-primary-foreground font-bold text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CapacitaJUN</h1>
              <p className="text-xs text-muted-foreground">EletronJUN</p>
            </div>
          </div>
          
          <Button onClick={handleLogin} className="bg-gradient-primary shadow-medium">
            Entrar
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 bg-gradient-secondary">
            🚀 Sistema de Capacitações EletronJUN
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Aprenda como no
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Duolingo</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Desenvolva suas habilidades através de trilhas gamificadas. 
            Assista vídeos, responda questões e compete com seus colegas no ranking mensal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-primary shadow-strong text-lg px-8 py-6 h-auto"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Começar Agora
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Apenas para emails @eletronjun.com.br
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 border-border shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories Preview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Áreas de Capacitação</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Escolha entre diversas trilhas de conhecimento e desenvolva habilidades específicas para sua carreira
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="border-2 border-border shadow-soft hover:shadow-medium transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className={category.color}>{category.icon}</span>
                  <span className="font-medium text-foreground">{category.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-card rounded-3xl p-8 shadow-medium border-2 border-border">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">Como Funciona</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Assista o Conteúdo</h3>
              <p className="text-muted-foreground">Vídeos e materiais curados para cada trilha de aprendizado</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-secondary rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Responda as Questões</h3>
              <p className="text-muted-foreground">15 questões para cada lição. Acerte 80% para avançar</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-tertiary to-success rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Avance na Trilha</h3>
              <p className="text-muted-foreground">Desbloqueie novas lições e suba no ranking mensal</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se aos seus colegas da EletronJUN e desenvolva novas habilidades de forma divertida e eficaz.
          </p>
          
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-primary shadow-strong text-lg px-8 py-6 h-auto"
          >
            <Target className="h-5 w-5 mr-2" />
            Entrar com Email EletronJUN
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;