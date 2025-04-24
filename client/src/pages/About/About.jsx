import React from 'react';
import { FaInfoCircle, FaShieldAlt, FaUsers, FaRegHandshake } from 'react-icons/fa';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      {/* Header */}
      <section className="about-header">
        <div className="container">
          <h1 className="about-title">Біз туралы</h1>
          <p className="about-description">
            Digital ID Wallet - цифрлық ID құжаттарын сақтаудың инновациялық платформасы
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="about-content">
        <div className="container">
          <div className="about-section">
            <div className="section-icon">
              <FaInfoCircle />
            </div>
            <div className="section-text">
              <h2>Біздің миссиямыз</h2>
              <p>
                Digital ID Wallet-тің миссиясы - адамдардың жеке құжаттарын цифрлық түрде сақтау мен қолдануды қауіпсіз, ыңғайлы және қол жетімді ету. Біз қазіргі цифрлық әлемде құжаттарды басқарудың тиімді әдісін ұсынуға тырысамыз.
              </p>
              <p>
                Біздің платформа пайдаланушыларға жеке куәлік, студенттік билет, вакцинация паспорты сияқты маңызды құжаттарын бір жерде сақтап, оларды кез келген уақытта қолдануға мүмкіндік береді.
              </p>
            </div>
          </div>

          <div className="about-section">
            <div className="section-icon">
              <FaShieldAlt />
            </div>
            <div className="section-text">
              <h2>Қауіпсіздік және құпиялылық</h2>
              <p>
                Пайдаланушыларымыздың жеке деректерінің қауіпсіздігі мен құпиялылығы - біздің басты құндылығымыз. Біз барлық деректерді шифрлеу, қауіпсіз аутентификация және заманауи қауіпсіздік протоколдарын қолдану арқылы қорғаймыз.
              </p>
              <p>
                Біздің командамыз үнемі жүйенің қауіпсіздігін жетілдіру және потенциалды қауіп-қатерлерден қорғау үшін жұмыс жасап келеді.
              </p>
            </div>
          </div>

          <div className="about-section">
            <div className="section-icon">
              <FaUsers />
            </div>
            <div className="section-text">
              <h2>Біздің команда</h2>
              <p>
                Digital ID Wallet - бұл өз саласының мамандарынан құралған кәсіби команда. Біздің командада технология, қауіпсіздік, пайдаланушы тәжірибесі және деректерді қорғау саласындағы тәжірибелі мамандар бар.
              </p>
              <p>
                Біз пайдаланушыларымызға ең жақсы өнім ұсыну үшін үнемі жұмыс істеп, инновациялық шешімдерді интеграциялаймыз.
              </p>
            </div>
          </div>

          <div className="about-section">
            <div className="section-icon">
              <FaRegHandshake />
            </div>
            <div className="section-text">
              <h2>Серіктестік</h2>
              <p>
                Біз әртүрлі ұйымдармен, оның ішінде мемлекеттік органдармен, білім беру мекемелермен және бизнес құрылымдармен серіктестікте жұмыс істейміз. Серіктестік арқылы біз пайдаланушыларымызға кең ауқымды қызметтер мен мүмкіндіктерді ұсына аламыз.
              </p>
              <p>
                Егер сіз біздің платформамен серіктес болғыңыз келсе, бізбен байланысуға және ынтымақтастық мүмкіндіктерін талқылауға шақырамыз.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2 className="section-title3">Бізбен байланыс</h2>
          <p className="section-description">
            Сұрақтарыңыз бар ма? Бізге хабарласыңыз, біз көмектесуге дайынбыз.
          </p>

          <div className="contact-info1">
            <div className="contact-item">
              <h3>Email</h3>
              <p>info@digitalid.kz</p>
            </div>

            <div className="contact-item">
              <h3>Телефон</h3>
              <p>+7 775 852 4891</p>
            </div>

            <div className="contact-item">
              <h3>Мекенжай</h3>
              <p>Астана қ., Мангилик ел C.1.3</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;