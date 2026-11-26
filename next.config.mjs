/** @type {import('next').NextConfig} */
const nextConfig = {
 serverExternalPackages:["unpdf"],
 experimental:{serverActions:{bodySizeLimit:"4mb"}},
 reactStrictMode:true, poweredByHeader:false, productionBrowserSourceMaps:false,
 async headers(){return [{source:"/:path*",headers:[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Referrer-Policy",value:"no-referrer"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
 {key:"Strict-Transport-Security",value:"max-age=31536000"},
 {key:"Content-Security-Policy",value:"frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"}
 ]},{source:"/workspaces/:path*",headers:[{key:"Cache-Control",value:"private, no-store"}]},{source:"/auth/:path*",headers:[{key:"Cache-Control",value:"private, no-store"}]}];}
};
export default nextConfig;
