import "server-only"

import {prisma} from "@server/db/client"

export async function getWorkspaceMembership(userId: string){
  return prisma.membership.findFirst({
    where: {
      userId
    },
    include: {
      workspace: true
    }
  })
}
