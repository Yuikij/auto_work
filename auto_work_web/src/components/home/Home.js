import axiosInstance from "../../utils/request";
import {useNavigate} from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    // axiosInstance.get('/some-endpoint')
    //     .then(response => {
    //         // setData(response.data);
    //     })
    //     .catch(error => {
    //         console.error('Error fetching data:', error);
    //     });

    return <div>HOME</div>
}
export default Home;