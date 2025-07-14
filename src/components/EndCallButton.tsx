import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/Button";
import toast from "react-hot-toast";
import { useEffect } from "react";

function EndCallButton() {
  const call = useCall();
  const router = useRouter();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const updateInterviewStatus = useMutation(api.interviews.updateInterviewStatus);
  const createInterview = useMutation(api.interviews.createInterview);

  const interview = useQuery(api.interviews.getInterviewByStreamCallId, {
    streamCallId: call?.id || "",
  });

  // ✅ Auto-create interview if not found
  useEffect(() => {
    const maybeCreateInterview = async () => {
      if (!call || interview !== null) return;

      console.log("📢 Interview not found. Creating one...");
      try {
        await createInterview({
          title: "Untitled Interview",
          description: "Auto-generated",
          startTime: Date.now(),
          status: "live",
          streamCallId: call.id,
          candidateId: localParticipant?.userId || "unknown_candidate",
          interviewerIds: [], // optionally insert current user or others
        });

        toast.success("Interview auto-created!");
      } catch (err) {
        console.error("❌ Failed to auto-create interview:", err);
        toast.error("Failed to auto-create interview");
      }
    };

    maybeCreateInterview();
  }, [call, interview, createInterview, localParticipant]);

  // Still waiting for interview to load
  if (!call || interview === undefined) return null;

  // Still not created or failed to fetch
  if (!interview) return null;

  const isMeetingOwner = localParticipant?.userId === call.state.createdBy?.id;
  if (!isMeetingOwner) return null;

  const endCall = async () => {
    try {
      await call.endCall();

      await updateInterviewStatus({
        id: interview._id,
        status: "completed",
      });

      router.push("/");
      toast.success("Meeting ended for everyone");
    } catch (error) {
      console.error(error);
      toast.error("Failed to end meeting");
    }
  };

  return (
    <Button variant="destructive" onClick={endCall}>
      End Meeting
    </Button>
  );
}

export default EndCallButton;
