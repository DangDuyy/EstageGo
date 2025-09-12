import React from "react";
import { Button } from "@/components/ui/button";
import { Twitter, Dribbble, Twitch, Instagram, Linkedin } from "lucide-react";

const teamMembers = [
  {
    name: "John Doe",
    title: "Founder & CEO",
    bio: "Former co-founder of Opendoor. Early staff at Spotify and Clearbit.",
    imageUrl:
      "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Jane Doe",
    title: "Engineering Manager",
    bio: "Lead engineering teams at Figma, Pitch, and Protocol Labs.",
    imageUrl:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Bob Smith",
    title: "Product Manager",
    bio: "Former PM for Linear, Lambda School, and On Deck.",
    imageUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Peter Johnson",
    title: "Frontend Developer",
    bio: "Former frontend dev for Linear, Coinbase, and Postscript.",
    imageUrl:
      "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "David Lee",
    title: "Backend Developer",
    bio: "Lead backend dev at Clearbit. Former Clearbit and Loom.",
    imageUrl:
      "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Sarah Williams",
    title: "Product Designer",
    bio: "Founding design team at Figma. Former Pleo, Stripe, and Tile.",
    imageUrl:
      "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Michael Brown",
    title: "UX Researcher",
    bio: "Lead user research for Slack. Contractor for Netflix and Udacity.",
    imageUrl:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Elizabeth Johnson",
    title: "Customer Success",
    bio: "Lead CX at Wealthsimple. Former PagerDuty and Sqreen.",
    imageUrl:
      "https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
];

function AgentForm() {
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

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12">
        {teamMembers.map((member) => (
          <div key={member.name}>
            <img
              src={member.imageUrl}
              alt={member.name}
              width={600}
              height={600}
              className="w-full aspect-square rounded-lg object-cover bg-secondary"
              loading="lazy"
            />
            <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
            <p className="text-muted-foreground text-sm">{member.title}</p>
            <p className="mt-3">{member.bio}</p>

            <div className="mt-4 flex items-center gap-2.5">
              <Button
                className="bg-accent hover:bg-accent text-muted-foreground shadow-none"
                size="icon"
                asChild
              >
                <a href="#" target="_blank" rel="noreferrer noopener" aria-label="Twitter">
                  <Twitter className="stroke-muted-foreground" />
                </a>
              </Button>

              <Button
                className="bg-muted hover:bg-muted text-muted-foreground shadow-none"
                size="icon"
                asChild
              >
                <a href="#" target="_blank" rel="noreferrer noopener" aria-label="Dribbble">
                  <Instagram className="stroke-muted-foreground" />
                </a>
              </Button>

              <Button
                className="bg-muted hover:bg-muted text-muted-foreground shadow-none"
                size="icon"
                asChild
              >
                <a href="#" target="_blank" rel="noreferrer noopener" aria-label="Twitch">
                  <Linkedin className="stroke-muted-foreground" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentForm;
