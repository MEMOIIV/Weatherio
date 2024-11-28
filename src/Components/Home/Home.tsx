import { useEffect, useState } from "react";
import HomeStayle from "./Home.module.css";
import axios from "axios";
import dayjs from "dayjs";

interface AirQualityData {
  list: {
    components: {
      pm2_5: number;
      no2: number;
      o3: number;
      so2: number;
    };
    main:{
      aqi:number
    };
  }[];
};
interface WeatherData {
  name: string;

  main: {
    temp: number;
    pressure: number;
    humidity: number;
    feels_like: number;
  };

  visibility: number;

  sys: {
    country: string;
  };

  weather: { description: string; icon: string }[];

  wind: { deg: number; speed: number };
};
interface ForecastData {
  list: {
    dt_txt: string;
    main: { temp: number };
    weather: { icon: string }[];
  }[];
};
interface ForecastItem {
  dt_txt: string;
  main: {
    temp: number;
  };
  weather: {
    icon: string;
  }[];
};
interface ForecastD {
  list: ForecastItem[];
};


function Home() {
  const apiKey = "2797823af357fcabedc9fb8171e839b8";
  const [loading, setLoading] = useState(true);
  const [dayName, setDayName] = useState("");
  const [monthName, setMonthName] = useState("");
  const [dayNumber, setDayNumber] = useState("");
  const [sunrise, setSunrise] = useState<number | null>(null);
  const [sunset, setSunset] = useState<number | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const city:string = document.querySelector("input")?.value?? "";

//////       api  جلب البيانات من خلال ال        \\\\\ 

async function gitNameCity() {
  setLoading(true);
  try {
      // إرسال الطلب لجلب بيانات الطقس
      const { data } = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${
              city === "" ? "cairo" : city
          }&appid=${apiKey}&units=metric`
      );

      if (data.cod === 200) {
          setWeatherData(data);

          // إعداد أوقات الشروق والغروب
          if (data.sys.sunrise !== null && data.sys.sunset !== null) {
              setSunrise(data.sys.sunrise * 1000);
              setSunset(data.sys.sunset);
          }

          // استخراج التاريخ باستخدام dayjs
          const timestamp = dayjs.unix(data.dt);
          setDayName(timestamp.format("dddd"));
          setMonthName(timestamp.format("MMMM"));
          setDayNumber(timestamp.format("D"));

          // استخراج الإحداثيات لجلب جودة الهواء
          const { lat, lon } = data.coord;
          if (lat && lon) {
              const airQualityResponse = await axios.get(
                  `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
              );
              const airData = airQualityResponse.data;

              if (
                  airData &&
                  airData.list &&
                  airData.list[0]?.components
              ) {
                  setAirQuality(airData);
              }
          }
      }
  } catch (error ) {
    // تحقق مما إذا كان الخطأ كائنًا يحتوي على خاصية message
    if (error instanceof Error) { 
      alert("The name of the city or country is incorrect");
    }
  }finally {
    setLoading(false);  // إيقاف التحميل بعد اكتمال جلب البيانات
  }
  
}

    //////     تحول الارقام العشوائية الى وقت مفهوم       \\\\\ 

  const formattedSunrise = sunrise
    ? new Date(sunrise).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const formattedSunset = sunset
    ? new Date(sunset).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";


 //////    جلب بيانات الطقس لخمس ايام قادمة       \\\\\ 

  async function forecastResponse() {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${
        city === "" ? "cairo" : city
      }&appid=${apiKey}&units=metric`
    );
      setForecastData(data);
  }


   //////    جلب بيانات الطقس لعدد ساعات معينة        \\\\\ 
  
  async function forecastRe() {
    const { data }: { data: ForecastD } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${
        city === "" ? "cairo" : city
      }&appid=${apiKey}&units=metric`
    );
      setForecast(data.list.slice(0, 6));
  }

  useEffect(() => {
    gitNameCity();
    forecastResponse();
    forecastRe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const uniqueDates = new Set();
  const forecastDays: {
    dt_txt: string;
    main: { temp: number };
    weather: { icon: string }[];
  }[] = [];
  forecastData?.list?.forEach((forecast) => {
    const date = dayjs(forecast.dt_txt).format("YYYY-MM-DD"); // استخراج التاريخ فقط (دون الوقت)
    if (!uniqueDates.has(date)) {
      uniqueDates.add(date);
      forecastDays.push(forecast); // إضافة التوقعات لهذا اليوم
    }
  });
  function reload(){
    window.location.reload();
  }



  return (
    <div>
{loading?(
  <div className="position-fixed top-0 start-0 w-100 vh-100 bg-dark z-3 d-flex justify-content-center align-items-center p-2">
    <i className="fa-solid fa-circle-notch fa-spin fa-5x text-white"></i>
  </div>
):<section className={HomeStayle.layer + " mt-3"}>
<div className="container text-white">
  
  <div className="d-flex justify-content-between align-items-center">
    <h1 className={HomeStayle.sup} onClick={reload}>
      <i className="fa-solid fa-cloud fa-1x "></i> Weatherio
    </h1>

    <div className={HomeStayle.inputT + " ms-auto"}>
      <input
        type="text"
        placeholder="Search city"
        className="form-control pe-5 rounded-5 "
      />
      {/* <p className={HomeStayle.error}>{error}</p> */}
    </div>

    <div
      className={HomeStayle.icM_search + " position-relative  me-3"}
      onClick={gitNameCity}
    >
      <i className="fa-solid fa-magnifying-glass  position-absolute top-50 start-50 translate-middle"></i>
    </div>
  </div>

  <div className="row my-5 ">

    {/* الجزء الخاص ببيانت الطقس الحالية  */}

    <div className="col-lg-4">
      <div>
        {weatherData && (
          <div className={HomeStayle.lol + " shadow-lg p-4   rounded"}>
            <h5>Now</h5>
            <div className={HomeStayle.section1 + " d-flex p-0 m-0 "}>
              <h3 className={HomeStayle.degre}>
                {Math.round(weatherData.main.temp)}°C
              </h3>
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
                className={HomeStayle.imgIco}
                alt="img"
              />
            </div>
            <p className={HomeStayle.status + " text-uppercase m-0"}>
              {weatherData.weather[0].description}
            </p>

            <div className="d-flex align-items-center px-2 mt-4">
              <i className="fa-solid fa-calendar-days me-1 "></i>
              <p className="p-0 m-0">
                {dayName} , {monthName} {dayNumber}{" "}
              </p>
            </div>

            <div className="d-flex align-items-center px-2 mt-3">
              <i className="fa-solid fa-location-dot me-1 "></i>
              <p className=" m-0">
                {weatherData.name} {weatherData.sys.country}
              </p>
            </div>
          </div>
        )}

         {/* الجزء الخاص ببيانت الطقس لخمسة ايام قادمة   */}

        <h5 className="mt-4">5 Day Forecast</h5>
        <div
          className={
            HomeStayle.lol + " mt-4 shadow-lg p-4  mb-4  rounded  "
          }
        >
          {weatherData &&
            forecastDays.slice(0, 5).map((forecast, index) => (
              <div
                key={index}
                className="d-flex align-items-center justify-content-between my-1 "
              >
                <div className="d-flex align-items-center">
                  <img
                    src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`}
                    alt="icon"
                    className="w-50"
                  />
                  <p className="m-0 ">
                    {Math.round(forecast.main.temp)}°C
                  </p>
                </div>
                <p className="m-0 ">
                  {dayjs(forecast.dt_txt).format("D MMM")}
                </p>
                <p className="m-0 ">
                  {dayjs(forecast.dt_txt).format("dddd")}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>

    {/* هذا الجزء هو الجزء الايمن من الموقع ويحتوي على قسمين   */}

    <div className={HomeStayle.lol + " mb-5  rounded col-lg-8"}>
      <div>
        <div className="container  py-3">
          <div className="row py-4 px-2">
            <p className="m-0">Todays Highlights </p>

            {/* الجزء لاول الخاص بي بيانات جودة الهواء  */}
            
            <div className=" col-lg-6 ">
              <div
                className={
                  HomeStayle.colorSections +
                  " rounded shadow-lg p-3 my-2"
                }
              >
                <div className="d-flex mb-3 justify-content-between">
                  <h6>Air Quality Index</h6>
                    {airQuality?.list?.[0]?.main.aqi == 1 ? (
                      <button
                      className={
                        HomeStayle.good + 
                        " btn btn-success rounded-5 p-0 px-3 "
                      }
                    >
                      Good
                    </button>
                    ): <button
                    className={
                      HomeStayle.good + 
                      " btn btn-success rounded-5 p-0 px-3 "
                    }
                  >
                    Not Good
                  </button>}
                </div>
                {airQuality?.list?.[0]?.components && (
                  <div className="d-flex align-items-center justify-content-between">
                    <i className="fa-solid fa-wind fa-2x me-4"></i>
                    <div>
                      <h6 className="m-0 text-uppercase pb-2">pm25</h6>
                      <h5 className="pb-2 me-3">
                        {airQuality?.list?.[0]?.components.pm2_5}
                      </h5>
                    </div>
                    <div>
                      <h6 className="m-0 text-uppercase pb-2">no2</h6>
                      <h5 className="pb-2 me-3">
                        {airQuality?.list?.[0]?.components.no2}{" "}
                      </h5>
                    </div>
                    <div>
                      <h6 className="m-0 text-uppercase pb-2">so2</h6>
                      <h5 className="pb-2 me-3">
                        {airQuality?.list?.[0]?.components.so2}
                      </h5>
                    </div>
                    <div>
                      <h6 className="m-0 text-uppercase pb-2">o3</h6>
                      <h5 className="pb-2 me-3">
                        {airQuality?.list?.[0]?.components.o3}{" "}
                      </h5>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* الجزء الثاني الخاص ببيانات وقت الشروق و الغروب */}
            <div className="col-lg-6">
              <div
                className={
                  HomeStayle.colorSections +
                  " rounded shadow-lg py-4  my-2"
                }
              >
                <h6 className=" mb-3 px-3">Sunrise & Sunset</h6>
                {weatherData && (
                  <div className="d-flex justify-content-between p-1 ">
                    <div className="ms-2 d-flex ">
                      <img
                        src="../../../public/2682848_day_forecast_sun_sunny_weather_icon.png"
                        className={HomeStayle.iconSun + " mb-3"}
                        alt=""
                      />
                      <div className="ms-3">
                        <p className="m-0">sunrise</p>
                        <h5 className="">{formattedSunrise}</h5>
                      </div>
                    </div>
                    <div className=" d-flex px-3 ">
                      <i className="fa-solid fa-moon fa-2x "></i>
                      <div className="ms-3">
                        <p className="m-0">sunset</p>
                        <h5>{formattedSunset}</h5>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* هذا الجزء خاص ببيانت مثل سرغة الرياح ونسبة الرطوبة  */}

          {weatherData && (
            <div className="row">
              <div className="col-lg-3">
                <div
                  className={
                    HomeStayle.colorSections +
                    " rounded shadow-lg p-3 my-2"
                  }
                >
                  <p>Humidity</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <i className="fa-2x fa-brands fa-drupal"></i>
                    <p className="m-0">
                      <span>{weatherData.main.humidity}</span>%
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-3">
                <div
                  className={
                    HomeStayle.colorSections +
                    " rounded shadow-lg p-3 my-2"
                  }
                >
                  <p>Pressure</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <i className="fa-2x fa-solid fa-wind"></i>
                    <p className="m-0">
                      <span>{weatherData.main.pressure}</span>hPa
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-3">
                <div
                  className={
                    HomeStayle.colorSections +
                    " rounded shadow-lg p-3 my-2"
                  }
                >
                  <p>Visibility</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <i className="fa-2x fa-solid fa-eye"></i>
                    <p className="m-0">
                      <span>{weatherData.visibility / 1000} </span>km
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-3">
                <div
                  className={
                    HomeStayle.colorSections +
                    " rounded shadow-lg p-3 my-2"
                  }
                >
                  <p>Feels Like</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <i className="fa-2x fa-solid fa-temperature-low"></i>
                    <p className="m-0">
                      <span>
                        {Math.round(weatherData.main.feels_like)}
                      </span>
                      °C
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* هذا الجزء هو الجزء الاخير و الخاص بعرض بيانات الطقس لمدة ساعات معينة  */}
          <div className={HomeStayle.cardes + " row mt-3"}>

            {forecast.map((item, index) => {
              return (
                <div key={index} className="col-lg-2 col-md-4 col-sm-6">
                  <div className="rounded shadow-lg p-1 text-center">
                    <p className="m-1">
                      {new Date(item.dt_txt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                      alt="Weather Icon"
                      width="64"
                      height="64"
                    />
                    <p className="">{Math.round(item.main.temp)}°C</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</section> }
      {/*  الجزء الخاص ب العنون و خانة اليحث  */}

      
    </div>
  );
}

export default Home;
