// src/pages/LeaderboardGroupsPage.tsx
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  createGroup,
  fetchMyGroups,
  requestToJoin,
  setMemberStatus,
  LeaderboardGroup,
  GroupMember,
  deleteGroup,
  removeMember
} from "@/services/leaderboardGroupService";
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, LogIn, X, Copy, Check, Users,
  UserMinus, UserPlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

export default function LeaderboardGroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<LeaderboardGroup[]>([]);
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const loadGroups = async () => {
    if (!user) return;
    try {
      const fetchedGroups = await fetchMyGroups();
      console.log("Fetched groups:", fetchedGroups);
      setGroups(fetchedGroups);
    } catch (e: any) {
      toast.error("Could not load groups");
    }
  };
  useEffect(() => { loadGroups() }, [user]);

  // Create
  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error("Name required");
    try {
      await createGroup(groupName);
      toast.success("Group created");
      setGroupName(""); setShowCreateForm(false);
      await loadGroups();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Join
  const handleJoin = async () => {
    if (!groupCode.trim()) return toast.error("Code required");
    try {
      await requestToJoin(groupCode.trim().toUpperCase());
      toast.success("Joined group!");
      setGroupCode(""); setShowJoinForm(false);
      await loadGroups();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Leave
  const handleLeave = async (g: LeaderboardGroup) => {
    try {
      await removeMember(g.id, user!.id);
      toast.success("Left group");
      await loadGroups();
    } catch {
      toast.error("Could not leave");
    }
  };

  // Owner: Accept / Reject
  const handleApprove = async (g: LeaderboardGroup, m: GroupMember) => {
    await setMemberStatus(g.id, m.user_id, "accepted");
    toast.success("Member approved");
    await loadGroups();
  };
  const handleReject = async (g: LeaderboardGroup, m: GroupMember) => {
    // delete row instead
    await setMemberStatus(g.id, m.user_id, "pending"); // replace with delete call
    toast.success("Member rejected");
    await loadGroups();
  };

  const handleDelete = async (g: LeaderboardGroup) => {
      try {
        await deleteGroup(g.id);
        toast.success("Group deleted");
        await loadGroups();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Could not delete group");
      }
    };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard Groups</h1>
            <p className="text-muted-foreground">Private leaderboards</p>
          </div>
          <div className="space-x-2">
            <Button size="sm" onClick={() => { setShowCreateForm(true); setShowJoinForm(false); }}>
              <Plus className="mr-1" /> Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowJoinForm(true); setShowCreateForm(false); }}>
              <LogIn className="mr-1" /> Join
            </Button>
          </div>
        </div>

        {/* Create */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Group</CardTitle>
              <CardDescription>Name + code</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <Button onClick={handleCreate}>Go</Button>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}><X/></Button>
            </CardContent>
          </Card>
        )}

        {/* Join */}
        {showJoinForm && (
          <Card>
            <CardHeader>
              <CardTitle>Join Group</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="CODE1234"
                value={groupCode}
                onChange={e => setGroupCode(e.target.value)}
              />
              <Button onClick={handleJoin}>Join</Button>
              <Button variant="ghost" size="icon" onClick={()=>setShowJoinForm(false)}><X/></Button>
            </CardContent>
          </Card>
        )}

        {/* My Groups */}
        <div>
          <h2 className="text-xl font-semibold mb-2">My Groups</h2>
          {groups.length === 0 ? (
            <Card className="bg-muted/40">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Join or create a group to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {groups.map(g => {
                const accepted = g.leaderboard_group_members.filter(m => m.status==="accepted");
                const pending  = g.leaderboard_group_members.filter(m => m.status==="pending");
                const isOwner  = g.owner_id === user!.id;

                return (
                    <Card key={g.id} className="relative">
                    {/* Absolute Owner Badge */}
                    {isOwner && (
                        <div className="absolute top-4 right-4 z-10">
                        <Badge variant="outline">
                          {user.id === g.owner_id ? "Owner" : "Member"}
                        </Badge>
                        </div>
                    )}

                    <CardHeader className="pb-4">
                        <div className="space-y-1">
                        <CardTitle className="text-lg leading-snug">{g.name}</CardTitle>
                        <CardDescription className="flex items-center text-sm space-x-2">
                            <Users className="mr-1" />
                            <span>{accepted.length} members</span>
                        </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                      {/* Avatars of accepted members
                      <div className="flex space-x-1">
                        {accepted.slice(0,5).map((m,i)=>(
                          <Avatar key={i} className="w-8 h-8">
                            <AvatarFallback>👤</AvatarFallback>
                          </Avatar>
                        ))}
                      </div> */}

                      {/* Pending requests for owners */}
                      {/* {isOwner && pending.length>0 && (
                        <div className="mt-4 space-y-2">
                          <p className="font-medium">Requests:</p>
                          {pending.map(m=>(
                            <div key={m.user_id} className="flex items-center justify-between">
                              <span className="text-sm">{m.user_id}</span>
                              <div className="space-x-1">
                                <Button size="icon" onClick={()=>handleApprove(g,m)}>
                                  <Check className="w-4 h-4 text-green-600"/>
                                </Button>
                                <Button size="icon" variant="destructive" onClick={()=>handleReject(g,m)}>
                                  <X className="w-4 h-4"/>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )} */}
                    </CardContent>

                    <CardFooter className="flex justify-between items-center">
                      {/* Code + copy */}
                      <div className="flex items-center space-x-1">
                        <code className="text-xs font-mono">{g.join_code}</code>
                        <Button variant="ghost" size="icon" onClick={()=>{
                          navigator.clipboard.writeText(g.join_code);
                          setCopiedGroupId(g.id);
                          setTimeout(()=>setCopiedGroupId(null),2000);
                        }}>
                          {copiedGroupId === g.id ? <Check/> : <Copy/>}
                        </Button>
                      </div>

                      {/* Leave / Delete */}
                      <div className="space-x-2">
                        {!isOwner && (
                            <Button variant="outline" size="sm" onClick={()=>handleLeave(g)}>
                                <UserMinus className="mr-1 w-3 h-3"/> Leave
                            </Button>
                        )}
                        {isOwner && (
                          <Button variant="destructive" size="sm" onClick={()=>handleDelete(g)}>
                            <X className="mr-1 w-3 h-3"/> Delete Group
                          </Button>
                        )}
                      </div>
                    </CardFooter>

                    <div className="px-6 pb-4">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => navigate(`/leaderboard/groups/${g.id}`)}>
                            Show Leaderboard
                        </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}   


