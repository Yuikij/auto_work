import axiosInstance from "../../utils/request";
import {useNavigate} from "react-router-dom";
import FileList from "../FileList";
import Template from "../Template";
import DataCell from "../DataCell";

const Home = () => {
    const navigate = useNavigate();
    // axiosInstance.get('/some-endpoint')
    //     .then(response => {
    //         // setData(response.data);
    //     })
    //     .catch(error => {
    //         console.error('Error fetching data:', error);
    //     });

    return <div>
        <FileList/>
        <Template/>
        <DataCell/>
    </div>
}
export default Home;