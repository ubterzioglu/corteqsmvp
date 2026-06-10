import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const PublicProfileBreadcrumb = () => (
  <nav aria-label="breadcrumb" className="mb-5">
    <Button asChild variant="outline" size="sm" className="rounded-full">
      <Link to="/directory">
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Dizine Dön
      </Link>
    </Button>
  </nav>
);

export default PublicProfileBreadcrumb;
