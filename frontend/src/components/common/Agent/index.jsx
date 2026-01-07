import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Twitter, Instagram, Linkedin } from "lucide-react";
import { getAllAgentsAPI } from "@/apis";

function AgentForm() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        const response = await getAllAgentsAPI('', 1, 100);
        // ✅ Only get users with role = 'agent'
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

  // Display agents according to visibleCount
  const displayedAgents = agents.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, agents.length));
  };

  return (
    <div className="flex flex-col justify-center sm:py-12 px-6 lg:px-8 max-w-screen-xl mx-auto gap-12">
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

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            <div key={member.id} className="cursor-pointer group" onClick={() => navigate(`/agents/${member.id}`)}>
              <img
                src={member.imageUrl}
                alt={member.name}
                width={400}
                height={400}
                className="w-full aspect-square rounded-lg object-cover bg-secondary group-hover:opacity-90 transition-opacity"
                loading="lazy"
              />
              <h3 className="mt-3 text-base font-semibold truncate">{member.name}</h3>
              <p className="text-muted-foreground text-sm truncate">{member.title.toUpperCase()}</p>
              <p className="mt-2 text-sm line-clamp-2">{member.bio}</p>

              <div className="mt-3 flex items-center gap-2">
                {member.email && (
                  <Button
                    className="bg-accent hover:bg-accent text-muted-foreground shadow-none"
                    size="icon"
                    asChild
                  >
                    <a href={`mailto:${member.email}`} aria-label="Email" className="w-8 h-8">
                      <Twitter className="stroke-muted-foreground w-4 h-4" />
                    </a>
                  </Button>
                )}

                {member.phone && (
                  <Button
                    className="bg-muted hover:bg-muted text-muted-foreground shadow-none"
                    size="icon"
                    asChild
                  >
                    <a href={`tel:${member.phone}`} aria-label="Phone" className="w-8 h-8">
                      <Instagram className="stroke-muted-foreground w-4 h-4" />
                    </a>
                  </Button>
                )}

                <Button
                  className="bg-muted hover:bg-muted text-muted-foreground shadow-none"
                  size="icon"
                  asChild
                >
                  <a href="#" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn" className="w-8 h-8">
                    <Linkedin className="stroke-muted-foreground w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {!isLoading && visibleCount < agents.length && (
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={handleLoadMore}
          >
            Load More ({agents.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

export default AgentForm;
