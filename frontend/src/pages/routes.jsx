import { Navigate, createBrowserRouter } from "react-router-dom";
import Home from "./home";
import Register from "./register";
import Login from "./login";
import Group from "./group";
import PrivateLayout from "../components/private-layout";
import PostDetail from "./post/PostDetail";
import MyDetails from "./user/MyDetails";
import UserDetails from "./user/UserDetails";
import ConfigPage from "./config-page";
import CreateGroup from "./group/creategroup";
import ManageGroup from "./managegroup";
import ManageGroupPosts from "./managegroupposts";
import Admin from "./admin";
import AdminUsers from "./admin/components/users";
import AdminGroups from "./admin/components/groups";
import AdminPosts from "./admin/components/posts";
import DiscoverGroup from "./discovergroup";
import GroupMemberManagement from "./groupmembermanagement";
import GroupMain from "./groupmain";
import ProtectedRoute from "../components/protectedRoute";
import Friends from "./friends/index.jsx";
import FriendList from "./friends/components/friendlist/index.jsx";
import FriendRequest from "./friends/components/friendrequest/index.jsx";
import PostHistory from "./post/postHistory";
import CommentHistory from "./comment/CommentHistory";

export const router = createBrowserRouter([
  { path: "*", element: <Navigate to="/" /> },
  {
    path: '/',
    element: <PrivateLayout />,
    children: [
      { index: true, element: <ProtectedRoute element={<Home />} /> },
      { path: 'groups', element: <ProtectedRoute element={<Group />} /> },
      { path: 'creategroup', element: <ProtectedRoute element={<CreateGroup />} /> },
      { path: 'managegroup', element: <ProtectedRoute element={<ManageGroup />} /> },
      { path: 'manage-group-posts/:groupName', element: <ProtectedRoute element={<ManageGroupPosts />} /> },
      { path: 'discovergroup', element: <ProtectedRoute element={<DiscoverGroup />} /> },
      { path: 'groupmembermanagement/:groupName', element: <ProtectedRoute element={<GroupMemberManagement />} /> },
      { path: 'groupmain/:groupId', element: <ProtectedRoute element={<GroupMain />} /> },
      { path: 'post/:id', element: <ProtectedRoute element={<PostDetail />} /> },
      { path: "post/:id/history", element: <ProtectedRoute element={<PostHistory />} /> },
      { path: "comment/:commentId/history", element: <ProtectedRoute element={<CommentHistory />} /> },
      { path: 'mydetail', element: <ProtectedRoute element={<MyDetails />} /> },
      { path: 'user/:userId', element: <ProtectedRoute element={<UserDetails />} /> },
      { path: 'config', element: <ProtectedRoute element={<ConfigPage />} /> },
      {
        path: "/admin",
        element: <ProtectedRoute element={<Navigate to="/admin/users" />} />,
      },
      {
        path: 'admin',
        element: <ProtectedRoute element={<Admin />} />,
        children: [
          { path: "users", element: <AdminUsers />, name: "Users" },
          { path: "groups", element: <AdminGroups />, name: "Groups" },
          { path: "posts", element: <AdminPosts />, name: "Posts" },
        ]
      },
      {
        path: "/friends",
        element: <ProtectedRoute element={<Navigate to="/friends/friendlist" />} />,
      },
      {
        path: '/friends',
        element: <Friends />,
        children: [
          { path: 'friendlist', element: <FriendList />, name: "Friend List" },
          { path: "friendrequest", element: <FriendRequest />, name: "Friend Requests" },
        ]
      }
    ],
  },
  { path: 'register', element: <Register /> },
  { path: 'login', element: <Login /> }
]);
