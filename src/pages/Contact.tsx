import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Instagram } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add any submission logic here
  };

  const socialLinks = [
    {
      icon: <Github className="h-6 w-6" />,
      label: "GitHub",
      href: `${import.meta.env.VITE_GITHUB}`,
    },
    {
      icon: <Linkedin className="h-6 w-6" />,
      label: "LinkedIn",
      href: `${import.meta.env.VITE_LINKEDIN}`,
    },
    {
      icon: <Instagram className="h-6 w-6" />,
      label: "Instagram",
      href: `${import.meta.env.VITE_INSTA}`,
    },
  ];

  return (
    <>
    <Navbar />
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Get in Touch</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition duration-300 shadow-md hover:shadow-lg text-gray-700"
          >
            {link.icon}
            <span className="font-semibold">{link.label}</span>
          </a>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 p-6 rounded-t-lg">
          <CardTitle className="text-2xl font-semibold text-gray-800">Send me a message</CardTitle>
          <CardDescription className="text-gray-600">
            Fill out the form below and I'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-gray-700">First name</Label>
                <Input id="firstName" placeholder="Enter your first name" className="border border-gray-300 rounded-lg px-4 py-2" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-gray-700">Last name</Label>
                <Input id="lastName" placeholder="Enter your last name" className="border border-gray-300 rounded-lg px-4 py-2" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" className="border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="subject" className="text-gray-700">Subject</Label>
              <Input id="subject" placeholder="Enter message subject" className="border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="message" className="text-gray-700">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                className="min-h-[150px] border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            
            <Button type="submit" className="w-full py-3 font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default Contact;
