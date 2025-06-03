
import ChampiñonMarker from "./ChampiñonMarker";
import StickyHeader from "./components/header";
import { FormChampi } from "@/components/form";
import { ImageAnnotator } from "./components/image/image";

import eruda from 'eruda';


eruda.init();

function App() {
  return (
    <>
      <StickyHeader />
      <main className="@container/main flex flex-1 flex-col gap-2 p-4 lg:max-w-7xl lg:mx-auto">
        <h2 className="text-2xl mt-2 mb-8">Toma datos</h2>
        <ImageAnnotator />
        <FormChampi />
      </main>
    </>

  );
}

export default App;
