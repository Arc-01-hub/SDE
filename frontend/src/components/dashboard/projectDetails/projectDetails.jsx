import { CiCalendarDate } from 'react-icons/ci';
import ProjectCard from '../mainContent/projectCard/projectCard';
import './projectDetails.css';
import { IoPersonAddOutline, IoPersonOutline } from 'react-icons/io5';

export const ProjectDetails = () => {
    return (
        <div className="project-details">
            <div className="project-header">
                <h2>Project N° 1</h2>
                <p>Project description goes here.</p>
            </div>
            <div className="project-info">
                <div className="project-display">

                </div>
                <div className='project-users'>
                    <div className='project-date'>
                        <h3>Date</h3>
                        <p>
                        <CiCalendarDate />
                            12/12/2023</p>
                    </div>
                    <div className='project-owner'>
                        <h3>Owner</h3>
                        <p> <IoPersonAddOutline />
                            User 1</p> 
                    </div>
                    <div className='project-collaborators'>
                        <h3>Collaborators</h3>
                        <div>
                            <p> <IoPersonOutline />
                                User 1</p>
                            <p> <IoPersonOutline />
                                User 2</p>
                            <p> <IoPersonOutline />
                                User 3</p>
                        </div>
                    </div>
                    <div className='project-tags'>
                        <div className='tag'><span>Tag 1</span></div>
                        <div className='tag'><span>Tag 2</span></div>
                        <div className='tag'><span>Tag 3</span></div>

                    </div>
                    <div className='project-actions'>
                        <button className='btn-primary'>Add Collaborator</button>
                        <button className='btn-delete'>Delete Project</button>
                    </div>
                    
                </div>
            </div>

        </div>
    );
};
