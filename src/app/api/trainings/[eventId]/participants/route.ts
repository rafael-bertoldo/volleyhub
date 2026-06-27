import { GET as legacyGET } from "../../../treinos/[eventoId]/participantes/route";

export function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return legacyGET(request, {
    params: params.then(({ eventId }) => ({ eventoId: eventId })),
  });
}
