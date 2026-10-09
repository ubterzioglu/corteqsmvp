import {
  APP_CLIENT,
  APP_CORE,
  APP_EXTERNAL,
  APP_MODULES,
  APP_PLATFORM,
  APP_SECRETS,
} from "@/lib/investor/architecture-content";

// 01 · Uygulama mimarisi diyagramı — HTML/CSS ızgara (dar ekranda tek sütuna iner).
// ⚠️ Host/IP/proje kimliği YAZILMAZ — yalnız katman adları.
const ArchAppDiagram = () => (
  <div className="arch-app" role="group" aria-label="Uygulama mimarisi diyagramı">
    <div className="arch-box arch-app__client">
      <div className="arch-box__title">{APP_CLIENT.title}</div>
      <div className="arch-box__text">{APP_CLIENT.text}</div>
    </div>
    <div className="arch-box arch-box--soft arch-app__secrets">
      <div className="arch-box__title">{APP_SECRETS.title}</div>
      <div className="arch-box__text">{APP_SECRETS.text}</div>
    </div>

    <div className="arch-link arch-app__https inv-mono">HTTPS</div>

    <div className="arch-box arch-box--navy arch-app__core">
      <div className="arch-box__label inv-mono">{APP_CORE.label}</div>
      <div className="arch-app__core-title">{APP_CORE.title}</div>
      <div className="arch-box__text">{APP_CORE.text}</div>
      <div className="arch-app__modules">
        {APP_MODULES.map((module) => (
          <div key={module.title} className="arch-app__module">
            <div className="arch-app__module-title">{module.title}</div>
            <div className="arch-app__module-text">{module.text}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="arch-box arch-app__external">
      <div className="arch-app__external-head">Dış servisler</div>
      <dl>
        {APP_EXTERNAL.map((service) => (
          <div key={service.title}>
            <dt>{service.title}</dt>
            <dd>{service.text}</dd>
          </div>
        ))}
      </dl>
    </div>

    <div className="arch-link arch-app__sql inv-mono">Oturum jetonu · REST / RLS</div>

    <div className="arch-box arch-box--soft arch-app__platform">
      <div className="arch-app__platform-title">{APP_PLATFORM.title}</div>
      {APP_PLATFORM.lines.map((line) => (
        <div key={line} className="arch-box__text">
          {line}
        </div>
      ))}
    </div>
  </div>
);

export default ArchAppDiagram;
