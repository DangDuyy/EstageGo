import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, Phone, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AgentCard({ agent }) {
  return (
    <Link to={`/agents/${agent._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={agent.avatar} alt={agent.fullName} />
              <AvatarFallback className="text-lg">
                {agent.fullName?.charAt(0) || agent.userName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">
                {agent.fullName || agent.userName}
              </h3>
              
              {agent.agentTitle && (
                <p className="text-sm text-muted-foreground mb-2 truncate">
                  {agent.agentTitle}
                </p>
              )}
              
              {agent.companyName && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{agent.companyName}</span>
                </div>
              )}
              
              {agent.address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{agent.address}</span>
                </div>
              )}
              
              {agent.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{agent.phone}</span>
                </div>
              )}
              
              {agent.areasServed && agent.areasServed.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {agent.areasServed.slice(0, 3).map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {agent.areasServed.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{agent.areasServed.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
