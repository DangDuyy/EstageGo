import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Twitter, Instagram, Linkedin } from "lucide-react";
import { getAllAgentsAPI } from "@/apis";

function AgentForm() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        const response = await getAllAgentsAPI('', 1, 100);
        // ✅ Chỉ lấy user có role = 'agent'
        const mappedAgents = (response?.agents || response?.data || [])
          .filter((user) => user.role === 'agent')
          .map((user) => ({
            id: user._id,
            name: user.fullName || "Agent",
            title: user.role || "Real Estate Agent",
            bio: user.bio || "Experienced real estate professional",
            imageUrl: user.avatar || "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600",
            email: user.email,
            phone: user.phone,
          }));
        setAgents(mappedAgents);
      } catch (error) {
        console.error("Error loading agents:", error);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  // Hiển thị 6 agents đầu tiên hoặc tất cả nếu showAll = true
  const displayedAgents = showAll ? agents : agents.slice(0, 6);

  return (
    <div className="flex flex-col justify-center sm:py-12 px-6 lg:px-8 max-w-screen-xl mx-auto gap-16">
      <div className="text-center max-w-2xl mx-auto">
        <b className="text-center text-muted-foreground text-base font-semibold">
          We&apos;re hiring!
        </b>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
          Meet Our Team
        </h2>
        <p className="mt-6 text-base sm:text-lg">
          Our philosophy is simple — hire a team of diverse, passionate people
          and foster a culture that empowers you to do your best work.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row-reverse sm:justify-center gap-3">
          <Button size="lg">Open Positions</Button>
          <Button size="lg" variant="outline">
            About Us
          </Button>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-8">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No agents available</p>
          </div>
        ) : (
          displayedAgents.map((member) => (
            <div key={member.id} className="cursor-pointer" onClick={() => navigate(`/agents/${member.id}`)}>
              <img
                src={member.imageUrl}
                alt={member.name}
                width={200}
                height={200}
                className="w-full aspect-square rounded-lg object-cover bg-secondary"
                loading="lazy"
              />
              <h3 className="mt-2 text-sm font-semibold truncate">{member.name}</h3>
              <p className="text-muted-foreground text-xs truncate">{member.title.toUpperCase()}</p>

              <div className="mt-2 flex items-center gap-1.5">
                {member.email && (
                  <Button
                    className="bg-accent hover:bg-accent text-muted-foreground shadow-none"
                    size="icon"
                    asChild
                  >
                    <a href={`mailto:${member.email}`} aria-label="Email" className="w-7 h-7">
                      <Twitter className="stroke-muted-foreground w-3 h-3" />
                    </a>
                  </Button>
                )}

                {member.phone && (
                  <Button
                    className="bg-muted hover:bg-muted text-muted-foreground shadow-none"
                    size="icon"
                    asChild
                  >
                    <a href={`tel:${member.phone}`} aria-label="Phone" className="w-7 h-7">
                      <Instagram className="stroke-muted-foreground w-3 h-3" />
                    </a>
                  </Button>
                )}

                <Button
                  className="bg-muted hover:bg-muted text-muted-foreground shadow-none"
                  size="icon"
                  asChild
                >
                  <a href="#" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn" className="w-7 h-7">
                    <Linkedin className="stroke-muted-foreground w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nút Xem thêm/Thu gọn */}
      {!isLoading && agents.length > 6 && (
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Thu gọn" : `Xem thêm (${agents.length - 6} agents)`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AgentForm;
